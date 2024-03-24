import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function WaitingRoom() {
    const [users, setUsers] = useState([]);
    const location = useLocation();
    const history = useNavigate();
    const {roomID} = useParams(); //We extract the roomID from the URL
    console.log('roomID', roomID);
    const userName = useRef(location.state?.name || 'Anonymous');
    const ws = useRef(null);


    const joinTeam = (team) => {
        if (ws.current) {
            ws.current.send(JSON.stringify({ type: 'changeTeam', color: team, roomID: roomID}));
            localStorage.setItem('team', team);
        }
    };

    function getOrCreateUserId() {
        let userID = localStorage.getItem('userID');
        if (!userID) {
            userID = Date.now().toString(); // Simple userID generation logic
            localStorage.setItem('userID', userID);
        }
        return userID;
    }

    function disconnect() {
        //We clear the local storage
        localStorage.clear();
        //We close the connection
        ws.current.close();
        //We redirect to the main view
        history('/');
    }

    useEffect(() => {
        const userID = getOrCreateUserId();
        ws.current = new WebSocket('ws://localhost:3001'); //Matches server.js

        ws.current.onopen = () => {
            console.log('Connected to the server from WaitingRoom');
            if(!localStorage.getItem('userName')) {
                localStorage.setItem('userName', userName.current);
            } else {
                userName.current = localStorage.getItem('userName');
            }
            const team = localStorage.getItem('team') || 'none';
            console.log('Sending message', { type: 'setUser', name: userName.current, userID: userID, team: team, roomID: roomID})
            ws.current.send(JSON.stringify({ type: 'setUser', name: userName.current, userID: userID, team: team, roomID: roomID}));
        };

        
        
        ws.current.onmessage = (message) => {
            console.log('Received message', message.data);
            const response = JSON.parse(message.data);
            if(response.type === 'updateUsers') {
                setUsers(response.users);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from the server');
        };

        return () => {
            if(ws.current.readyState === 1)
                ws.current.close();
        };
    }, [roomID]);

    return (
        <div>
            <h2>Waiting Room</h2>
            <div id='teams'>
                <div id='red' className='team'>
                    <h3>Red Team</h3>
                    <ul>
                        {users.filter(user => user.team === 'red').map(user => (
                            <li key={user.id}>{user.name}</li>
                        ))}
                    </ul>
                </div>
                <div id='none' className='team'>
                    <h3>Choose a team!</h3>
                    <ul>
                        {users.filter(user => user.team === 'none').map(user => (
                            <li key={user.id}>{user.name}</li>
                        ))}
                    </ul>
                </div>
                <div id='blue' className='team'>
                    <h3>Blue Team</h3>
                    <ul>
                        {users.filter(user => user.team === 'blue').map(user => (
                            <li key={user.id}>{user.name}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div id = 'TeamButtons'>
                <button id='joinRed' onClick={() =>{joinTeam('red')}}>Join Red</button>
                <button id='joinBlue' onClick={() =>{joinTeam('blue')}}>Join Blue</button>
            </div>
            <button id = 'Disconnect' onClick={() => {disconnect()}}>Disconnect</button>
        </div>
    );
}

export default WaitingRoom;