const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const rooms = {}; // Store all rooms

wss.on('connection', (ws) => {
    let userID = null;
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if(data.type === 'createRoom') {
                const roomID = 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
                rooms[roomID] = { users: [] };
                ws.roomID = roomID;
                ws.send(JSON.stringify({ type: 'roomCreated', roomID: roomID }));
            }

            if(data.type === 'setUser') {
                const roomID = data.roomID;
                ws.roomID = roomID;

                if(!rooms[roomID]) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
                    return;
                }

                const userId = data.userID;
                userID = userId;
                const userName = data.name;
                const team = data.team;

                const user = rooms[roomID].users.find(user => user.id === userId);
                
                if(user) {
                    user.ws = ws;
                    user.name = userName;
                    user.team = team;
                } else {
                    rooms[roomID].users.push({ id: userId, name: userName, team: team, ws });
                }
                broadcastUsers(roomID);
            }

            if(data.type === 'changeTeam') {
                const roomID = data.roomID;
                rooms[roomID].users = rooms[roomID].users.map(user => {
                    if(user.id === userID) {
                        user.team = data.color;
                    }
                    return user;
                });
                broadcastUsers(roomID);
            }
        } catch (error) {
            console.error('Failed to parse message', error);
        }
    });

    ws.on('close', () => {
        if(ws.roomID && rooms[ws.roomID]) {
            rooms[ws.roomID].users = rooms[ws.roomID].users.filter(user => user.ws !== ws);
            broadcastUsers(ws.roomID);
        }
    });
});

function broadcastUsers(roomID) {
    const room = rooms[roomID];
    if(!room) return;

    room.users.forEach(({ ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'updateUsers',
                users: room.users.map(({ id, name, team }) => ({ id, name, team }))
            }));
        }
    });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));