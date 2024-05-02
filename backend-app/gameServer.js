const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

class game {
    constructor(roomID, gameRoomID, users) {
        this.roomID = roomID;
        this.gameRoomID = gameRoomID;
        this.users = users;
    }
};

const games = {}; // Store all games

wss.on('connection', (ws) =>{
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if(data.type === 'initializeGame') {
                const gameRoomID = data.gameRoomID;
                const roomID = data.roomID;
                const users = data.users;
                //iterate through all users and set their ws to null for now
                users.forEach((user) => {
                    user.ws = null;
                });

                const newGame = new game(roomID, gameRoomID, users);
                games[gameRoomID] = newGame;
                sendStartGameResponse(gameRoomID, roomID);
            }

            if(data.type == 'userJoin'){
                const userID = data.userID;
                const gameRoomID = data.gameRoomID;
                const game = games[gameRoomID];
                if(!game){
                    ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
                    return;
                }
                const user = game.users.find(user => user.id === userID);
                user.ws = ws;
                ws.gameRoomID = gameRoomID;
            }

        } catch (error) {
            console.error('Error parsing message: ', error);
        }
    });

    ws.on('close', () => {
        if(ws.gameRoomID) {
            games[ws.gameRoomID].users = games[ws.gameRoomID].users.filter(user => user.ws !== ws);
            if(games[ws.gameRoomID].users.length === 0) {
                delete games[ws.gameRoomID];
            } 
            broadCastUsers(ws.gameRoomID);
        }
    });
})

sendStartGameResponse = (gameRoomID, roomID) => {
    const mainserverSocket = new WebSocket('ws://localhost:3001');
    mainserverSocket.on('open', () => {
        mainserverSocket.send(JSON.stringify({
            type: 'startGameResponse',
            gameRoomID: gameRoomID,
            roomID: roomID
        }));
        mainserverSocket.close();
    });
}

broadCastUsers = (gameRoomID) => {
    const game = games[gameRoomID];
    if(!game) return;

    game.users.forEach(({ ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'updateUsers',
                users: game.users.map(({ id, name, team, master }) => ({ id, name, team, master }))
            }));
        }
    });
}

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));