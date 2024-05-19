const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { on } = require('events');

const app = express();
const server = http.createServer(app);

const REACT_APP_SERVER1_URL= "https://my-backend-server1-610139900de0.herokuapp.com/"
const REACT_APP_GAMESERVER_URL="https://my-backend-gameserver-c1e077ac9497.herokuapp.com/"

const wss = new WebSocket.Server({ server });

const GameState = Object.freeze({
    MASTER_TURN: 'MASTER_TURN',
    GUESS_TURN: 'GUESS_TURN',
    WAITING: 'WAITING'
});

class game {
    constructor(roomID, gameRoomID, users, gameType) {
        this.roomID = roomID;
        this.gameRoomID = gameRoomID;
        this.users = users;
        this.redUsers = [];
        this.blueUsers = [];
        this.hasStarted = false;
        this.redScore = 0;
        this.blueScore = 0;
        this.cardsManager = new CardsManager();

        this.buildCardsManager('./cards.txt');



        this.currentMainCircleRotation = 0;
        this.POINTS_RADIUS = 45;

        users.forEach((user) => {
            user.disconnected = false;
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
        this.currentCard = {text1: '', text2: ''};
        this.gameState = GameState.WAITING;
    }

    buildCardsManager(cardsFilePath){
        /*
        const fs = require('fs');
        const cards = fs.readFileSync(cardsFilePath, 'utf8').split('\n');
        cards.forEach(card => {
            const [t1, t2] = card.split(',').map(t => t.trim());
            if(t1 && t2) this.cardsManager.addCard(new Card(t1, t2));
        });
        console.log('CardsManager built with ', this.cardsManager.getNumberOfCards(), ' cards');
        */
        this.cardsManager.addCard(new Card('jayjay', 'naynay'));
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
        let randomCard = this.cardsManager.getRandomCard();
        this.currentCard = randomCard;
        broadCastNewCard(this.gameRoomID, randomCard.text1, randomCard.text2);

        if(this.currentTeam === 'red') {
            this.redUsers[this.currentRedPlayerIndex].ws.send(JSON.stringify({ type: 'yourTurn' }));
            console.log('sent your turn to red player: ', this.redUsers[this.currentRedPlayerIndex].name);
            this.redUsers[this.currentRedPlayerIndex].master = true;
        } else {
            this.blueUsers[this.currentBluePlayerIndex].ws.send(JSON.stringify({ type: 'yourTurn' }));
            console.log('sent your turn to blue player: ', this.blueUsers[this.currentBluePlayerIndex].name);
            this.blueUsers[this.currentBluePlayerIndex].master = true;
        }
        broadCastUsers(this.gameRoomID);
        this.gameState = GameState.MASTER_TURN;
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

    winPoints(team, points, mainCircleRotation, guessRotation, shouldReveal = true) {
        console.log('team: ', team, " points: ", points);
        if(team === 'red') {
            this.redScore += points;
        } else {
            this.blueScore += points;
        }
        //We send to all users the new scores
        this.users.forEach(user => {
            user.ws.send(JSON.stringify({ type: 'updateScores', scores: { red: this.redScore, blue: this.blueScore }}));
            user.ws.send(JSON.stringify({ type: 'revealScore', score: points, team: team , mainCircleRotation: mainCircleRotation, guessRotation: guessRotation, shouldReveal: shouldReveal}));
        });
        this.gameState = GameState.WAITING;
    }

    guessTurn(mainCircleRotation, POINTS_RADIUS) {
        this.currentMainCircleRotation = mainCircleRotation;
        this.POINTS_RADIUS = POINTS_RADIUS;
        if(this.currentTeam === 'red') {
            let sameTeamNotMasterUsers = this.redUsers.filter(user => user.master === false);
            sameTeamNotMasterUsers.forEach(user => {
                user.ws.send(JSON.stringify({ type: 'yourGuessTurn' }));
            });
        } else {
            let sameTeamNotMasterUsers = this.blueUsers.filter(user => user.master === false);
            sameTeamNotMasterUsers.forEach(user => {
                user.ws.send(JSON.stringify({ type: 'yourGuessTurn' }));
            });
        }
        this.gameState = GameState.GUESS_TURN;
    }

    userGuess(guessRotation) {
        let trueMainCircleRotation = 90 - this.currentMainCircleRotation*180/Math.PI;
        let secondMainCircleRotation = trueMainCircleRotation + 180;
        if(secondMainCircleRotation > 360) secondMainCircleRotation -= 360;
        let threePointsRadius = (1/12)*this.POINTS_RADIUS;
        let twoPointsRadius = (1.5/6)*this.POINTS_RADIUS;
        let onePointRadius = this.POINTS_RADIUS/2;

        console.log('trueMainCircleRotation: ', trueMainCircleRotation);
        console.log('secondMainCircleRotation: ', secondMainCircleRotation);
        
        guessRotation = guessRotation*180/Math.PI;
        console.log('guessRotation: ', guessRotation);

        //We check if we have the three points. We know guessRotation is between 0 and 180:
        if(trueMainCircleRotation - threePointsRadius <= guessRotation && guessRotation <= trueMainCircleRotation + threePointsRadius){
            this.winPoints(this.currentTeam, 3, this.currentMainCircleRotation, guessRotation);
        } else if(secondMainCircleRotation - threePointsRadius <= guessRotation && guessRotation <= secondMainCircleRotation + threePointsRadius){
            this.winPoints(this.currentTeam, 3, this.currentMainCircleRotation, guessRotation);
        } else if(trueMainCircleRotation - twoPointsRadius <= guessRotation && guessRotation <= trueMainCircleRotation + twoPointsRadius){
            this.winPoints(this.currentTeam, 2, this.currentMainCircleRotation, guessRotation);
        } else if(secondMainCircleRotation - twoPointsRadius <= guessRotation && guessRotation <= secondMainCircleRotation + twoPointsRadius){
            this.winPoints(this.currentTeam, 2, this.currentMainCircleRotation, guessRotation);
        } else if(trueMainCircleRotation - onePointRadius <= guessRotation && guessRotation <= trueMainCircleRotation + onePointRadius){
            this.winPoints(this.currentTeam, 1, this.currentMainCircleRotation, guessRotation);
        } else if(secondMainCircleRotation - onePointRadius <= guessRotation && guessRotation <= secondMainCircleRotation + onePointRadius){
            this.winPoints(this.currentTeam, 1, this.currentMainCircleRotation, guessRotation);
        } else {
            this.winPoints(this.currentTeam === 'red' ? 'blue' : 'red', 1, this.currentMainCircleRotation, guessRotation);
        }
    }

    onDisconnect(user){
        let team = user.team;
        user.disconnected = true;

        //If the user was the master, the team wins 0 points and we go to the next turn IFF there are at least 2 players in the other team
        let teamUsers = team === 'red' ? this.redUsers : this.blueUsers;
        let oppositeTeamUsers = team === 'red' ? this.blueUsers : this.redUsers;

        if(user.master){
            //If there are at least 2 players in the opposite team that have disconnected = false, we go to the next turn
            if(oppositeTeamUsers.filter(user => user.disconnected === false).length >= 2){
                this.winPoints(team, 0, 0, 0, false);
                this.nextTurn();
            }
            //If there are less than 2 players in the opposite team that have disconnected = false, we wait for them to reconnect
        }
    }
    onReconnect(user){
        let team = user.team;
        user.disconnected = false;

        //If the user was the master, we send him the yourTurn message cause that means we are waiting for him to reconnect
        if(user.master){
            user.ws.send(JSON.stringify({ type: 'yourTurn' }));
        }

        //If the user was not the master, and the master is on his team not disconnected, we send him the yourGuessTurn message
        let teamUsers = team === 'red' ? this.redUsers : this.blueUsers;
        let oppositeTeamUsers = team === 'red' ? this.blueUsers : this.redUsers;

        if(!user.master && teamUsers.find(user => user.master === true && user.disconnected === false) && this.gameState === GameState.GUESS_TURN){
            user.ws.send(JSON.stringify({ type: 'yourGuessTurn' }));
        }

        //If the user was not the master, and the master is on the opposite team and not disconnected, we do nothing

        //We rebroadcast the current card to the user and the scores to this user
        user.ws.send(JSON.stringify({ type: 'newCard', cardTexts: { text1: this.currentCard.text1, text2: this.currentCard.text2 }}));
        user.ws.send(JSON.stringify({ type: 'updateScores', scores: { red: this.redScore, blue: this.blueScore }}));
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
                const gameType = data.gameType;
                //iterate through all users and set their ws to null for now
                users.forEach((user) => {
                    user.ws = null;
                    user.master = false;
                });

                const newGame = new game(roomID, gameRoomID, users, gameType);
                games[gameRoomID] = newGame;
                sendStartGameResponse(gameRoomID, roomID);
                console.log('Game initialized with roomID: ', roomID, ' and gameRoomID: ', gameRoomID);
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

            if(data.type === 'guessTurn'){
                const gameRoomID = data.gameRoomID;
                const mainCircleRotation = data.mainCircleRotation;
                const POINTS_RADIUS = data.pointsRadius;
                const game = games[gameRoomID];
                if(!game) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
                    return;
                }
                let user = game.users.find(user => user.ws === ws);
                if(user.master){
                    game.guessTurn(mainCircleRotation, POINTS_RADIUS);
                }
            }

            if(data.type === 'userGuess'){
                const gameRoomID = data.gameRoomID;
                const guessRotation = data.guessRotation;
                const game = games[gameRoomID];
                if(!game) {
                    ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
                    return;
                }
                game.userGuess(guessRotation);
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
                        game.onReconnect(user);
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
            games[ws.gameRoomID].onDisconnect(leavingUser);
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
    const serverURL = REACT_APP_SERVER1_URL.replace(/^http/, 'ws');
    const mainserverSocket = new WebSocket(serverURL);
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

broadCastNewCard = (gameRoomID, text1, text2) => {
    const game = games[gameRoomID];
    if(!game) return;

    game.users.forEach(({ ws }) => {
        if(ws == null) return;
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'newCard',
                cardTexts: { text1: text1, text2: text2 }
            }));
        }
    });
    console.log('New card broadcasted with texts: ', text1, text2);
}

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

class CardsManager{
    constructor(){
        this.cards = [];
    }

    addCard(card){
        this.cards.push(card);
        this.updateWeights();
    }

    updateWeights(){
        const totalSelections = this.cards.reduce((acc, card) => acc + card.chosenCount, 0);
        const baseWeight = totalSelections > 0 ? 1 / (totalSelections + this.cards.length): this.cards.length;

        this.cards.forEach(card => {
            card.weight = baseWeight / (card.chosenCount + 1);
        });

        const totalWeight = this.cards.reduce((acc, card) => acc + card.weight, 0);
        this.cards.forEach(card => {
            card.weight /= totalWeight;
        });
    }

    getRandomCard(){
        const rand = Math.random();
        let cumWeight = 0;

        for(const card of this.cards){
            cumWeight += card.weight;
            if(rand <= cumWeight){
                card.chosenCount++;
                this.updateWeights();
                return card;
            }
        }
    }

    getNumberOfCards(){
        return this.cards.length;
    }
}

class Card{
    constructor(text1, text2){
        this.text1 = text1;
        this.text2 = text2;
        this.chosenCount = 0;
    }
}