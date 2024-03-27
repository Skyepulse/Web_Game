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

            if(data.type === 'startGame') {
                const roomID = data.roomID;
                const room = rooms[roomID];
                if(room && room.masterUserID !== userID) {
                    ws.send(JSON.stringify({ type: 'error', message: 'You are not the master of this room! You cannot launch the game.' }));
                    return;
                }

                broadcastStartGame(roomID);
            }

            if(data.type === 'roomExists') {
                const roomID = data.roomID;
                if(rooms[roomID]) {
                    ws.send(JSON.stringify({ type: 'roomExists', roomID: roomID }));
                } else {
                    ws.send(JSON.stringify({ type: 'roomNotFound', roomID: roomID }));
                }
            }

            if(data.type === 'createRoom') {
                const roomID = 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
                rooms[roomID] = { users: [], masterUserID: null};
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
                let master = data.master;

                ws.master = master;
                if(!rooms[roomID].masterUserID && master) {
                    rooms[roomID].masterUserID = userId;
                    ws.master = true;
                } else {
                    ws.master = false;
                    master = false;
                }

                const user = rooms[roomID].users.find(user => user.id === userId);
                
                if(user) {
                    user.ws = ws;
                    user.name = 'ALREADY SET';
                    user.team = team;
                    user.master = master;
                } else {
                    rooms[roomID].users.push({ id: userId, name: userName, team: team, master: master, ws });
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
        if(ws.roomID && rooms[ws.roomID] && rooms[ws.roomID].users.length > 0) {
            rooms[ws.roomID].users = rooms[ws.roomID].users.filter(user => user.ws !== ws);
            //If users is empty, delete the room
            if(rooms[ws.roomID].users.length === 0) {
                delete rooms[ws.roomID];
            } else {
                if(ws.master){
                    //We have to reassign the master of the room to a random user in the room
                    const newMaster = rooms[ws.roomID].users[Math.floor(Math.random() * rooms[ws.roomID].users.length)];
                    newMaster.master = true;
                    newMaster.ws.master = true;
                    rooms[ws.roomID].masterUserID = newMaster.id;
                }
            }
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
                users: room.users.map(({ id, name, team, master }) => ({ id, name, team, master }))
            }));
        }
    });
}

function broadcastStartGame(roomID) {
    const room = rooms[roomID];
    if(!room) return;
    const gameRoomID = roomID + '-game';

    room.users.forEach(({ ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'startGame',
                gameRoomID: gameRoomID
            }));
        }
    });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));