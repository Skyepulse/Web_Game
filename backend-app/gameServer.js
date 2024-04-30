const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const games = {}; // Store all games

wss.on('connection', (ws) =>{
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if(data.type === 'initializeGame') {
                const gameRoomId = data.gameRoomId;
                const users = data.users;
            }
        } catch (error) {
            console.error('Error parsing message: ', error);
        }
    });

    ws.on('close', () => {

    });
})

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));