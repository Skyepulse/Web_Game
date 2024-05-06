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
        this.redUsers = [];
        this.blueUsers = [];
        this.hasStarted = false;

        users.forEach((user) => {
            if(user.team === 'red') {
                this.redUsers.push(user);
            }
            if(user.team === 'blue') {
                this.blueUsers.push(user);
            }
        });

        this.currentRedPlayerIndex = 0;
        this.currentBluePlayerIndex = 0;
        this.blueNumPlayers = this.blueUsers.length;
        this.redNumPlayers = this.redUsers.length;
        this.currentTeam = null;
    }

    selectRandomTeam() {
        //Select "blue" or "red" randomly
        this.currentTeam = Math.random() < 0.5 ? 'red' : 'blue';
    }

    initializeGame() {
        this.hasStarted = true;
        this.selectRandomTeam();
        this.readyPlayer();
    }

    readyPlayer(){
        if(this.currentTeam === 'red') {
            this.redUsers[this.currentRedPlayerIndex].ws.send(JSON.stringify({ type: 'yourTurn' }));
            this.redUsers[this.currentRedPlayerIndex].master = true;
        } else {
            this.blueUsers[this.currentBluePlayerIndex].ws.send(JSON.stringify({ type: 'yourTurn' }));
            this.blueUsers[this.currentBluePlayerIndex].master = true;
        }
        broadCastUsers(this.gameRoomID);
    }

    nextTurn() {
        if(this.currentTeam === 'red') {
            this.redUsers[this.currentRedPlayerIndex].master = false;
            this.currentRedPlayerIndex = (this.currentRedPlayerIndex + 1) % this.redNumPlayers;
        } else {
            this.blueUsers[this.currentBluePlayerIndex].master = false;
            this.currentBluePlayerIndex = (this.currentBluePlayerIndex + 1) % this.blueNumPlayers;
        }

        this.currentTeam = this.currentTeam === 'red' ? 'blue' : 'red';
        this.readyPlayer();
    }
};

const games = {};
const leftUsers = {};

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
                    user.master = false;
                });

                const newGame = new game(roomID, gameRoomID, users);
                games[gameRoomID] = newGame;
                sendStartGameResponse(gameRoomID, roomID);
            }

            if(data.type === 'nextTurn') {
                const gameRoomID = data.gameRoomID;
                const game = games[gameRoomID];
                if(!game) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
                    return;
                }
                let user = game.users.find(user => user.ws === ws);
                if(user.master){
                    game.nextTurn();
                } 
            }

            if(data.type == 'userJoin'){
                const userID = data.userID;
                const gameRoomID = data.gameRoomID;
                const game = games[gameRoomID];
                if(!game){
                    ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
                    return;
                }
                let user = game.users.find(user => user.id === userID);
                if(user){ // Meaning he was intended to be in the game
                    user.ws = ws;
                    ws.gameRoomID = gameRoomID;
                } else { // Meaning he was not intended to be in the game but has rejoined after leaving
                    user = leftUsers[gameRoomID].find(user => user.id === userID);
                    if(user){
                        leftUsers[gameRoomID] = leftUsers[gameRoomID].filter(user => user.id !== userID);
                        user.ws = ws;
                        game.users.push(user);
                        ws.gameRoomID = gameRoomID;
                    } else {
                        ws.send(JSON.stringify({ type: 'error', message: 'User not found, you are not a player of this game' }));
                        return;
                    }
                }
                broadCastUsers(gameRoomID);

                //We check if all users have joined (none have ws as null)
                if(game.users.every(user => user.ws !== null) && !game.hasStarted){
                    game.initializeGame();
                }
            }

        } catch (error) {
            console.error('Error parsing message: ', error);
        }
    });

    ws.on('close', () => {
        if(ws.gameRoomID) {
            const leavingUser = games[ws.gameRoomID].users.find(user => user.ws === ws);
            games[ws.gameRoomID].users = games[ws.gameRoomID].users.filter(user => user.ws !== ws);
            if(games[ws.gameRoomID].users.length === 0) {
                delete games[ws.gameRoomID];
                delete leftUsers[ws.gameRoomID];
                return;
            } 
            if(leftUsers[ws.gameRoomID]){
                leftUsers[ws.gameRoomID].push(leavingUser);
            } else {
                leftUsers[ws.gameRoomID] = [leavingUser];
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
        if(ws == null) return;
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'updateUsers',
                users: game.users.map(({ id, name, team, master }) => ({ id, name, team, master })),
                leftUsers: leftUsers[gameRoomID] ? leftUsers[gameRoomID].map(({ id, name, team, master }) => ({ id, name, team, master })) : []
            }));
        }
    });
}

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));