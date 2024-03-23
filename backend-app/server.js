const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let users = []; // store all connected users
 
wss.on('connection', (ws) => {
    const userID = users.length+1;
    let userName = 'User' + userID;
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if(data.type === 'setName' && data.name !== '') {
            userName = data.name;
        }

        if(!users.some(user => user.ws === ws)) {
            users.push({id: userID, name: userName, ws});
            broadcastUsers();
        }
    });

    ws.on('close', () => {
        users = users.filter(user => user.id !== userID);
        broadcastUsers();
    });
});

function broadcastUsers() { //send the updated users list to all connected users
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(users));
        }
    });
}

const PORT = process.env.PORT || 3001; //use the port provided by the environment or 3001
server.listen(PORT, () => {console.log(`Server started on port ${PORT}`)});