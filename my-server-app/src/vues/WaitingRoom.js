import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

function WaitingRoom() {
    const [users, setUsers] = useState([]);
    const location = useLocation();
    const userName = location.state?.name;

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001'); //Matches server.js

        ws.onopen = () => {
            console.log('Connected to the server');
            ws.send(JSON.stringify({ type: 'setName', name: userName }));
        };
        
        ws.onmessage = (message) => {
            const receivedUsers = JSON.parse(message.data);
            setUsers(receivedUsers);
        };

        ws.onclose = () => {
            console.log('Disconnected from the server');
        };

        return () => {
            if(ws.readyState === 1)
                ws.close();
        };
    }, [userName]);

    return (
        <div>
            <h2>Waiting Room</h2>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default WaitingRoom;