const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let users = []; // Store all connected users

wss.on('connection', (ws) => {
    let userID = null;
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if(data.type === 'setUser') {
                const userId = data.userID;
                userID = userId;
                const userName = data.name;
                const team = data.team;
                if(users.find(user => user.id === userId)) {
                    //We modify ws with the new connection
                    users = users.map(user => {
                        if(user.id === userId) {
                            user.ws = ws;
                            user.name = userName;
                            user.team = team;
                        }
                        return user;
                    });
                } else {
                    users.push({ id: userId, name: userName, team: team, ws });
                }
                broadcastUsers();
            }

            if(data.type === 'changeTeam') {
                users = users.map(user => {
                    if(user.id === userID) {
                        user.team = data.color;
                    }
                    return user;
                });
                broadcastUsers();
            }
        } catch (error) {
            console.error('Failed to parse message', error);
        }
    });

    ws.on('close', () => {
        users = users.filter(user => user.id !== userID);
        broadcastUsers();
    });
});

function broadcastUsers() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(users.map(({ id, name, team }) => ({ id, name, team }))));
        }
    });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));