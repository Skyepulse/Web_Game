import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function WaitingRoom() {
    const possibleAnonymousNames = useRef(['Turtoise', 'Lion', 'Elephant', 'Giraffe', 'Penguin', 'Kangaroo', 'Panda', 'Koala', 'Tiger', 'Zebra']);
    const [users, setUsers] = useState([]);
    const location = useLocation();
    const userName = useRef(location.state?.name);
    const ws = useRef(null);

    let history = useNavigate();

    const joinTeam = (team) => {
        if (ws.current) {
            ws.current.send(JSON.stringify({ type: 'changeTeam', color: team }));
            localStorage.setItem('team', team);
        }
    };

    function getOrCreateUserId() {
        let userID = localStorage.getItem('userID');
        if(!userID) {
            userID = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15);
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
        ws.current = new WebSocket('ws://localhost:3001'); //Matches server.js

        ws.current.onopen = () => {
            console.log('Connected to the server');
            const userID = getOrCreateUserId();
            if(userName.current === ''){
                userName.current = possibleAnonymousNames.current[Math.floor(Math.random() * possibleAnonymousNames.current.length)] + ' ' + Math.floor(Math.random() * 1000);
                console.log('Generated user name:', userName.current);
            }
            localStorage.setItem('userName', userName.current);
            const team = localStorage.getItem('team') || 'none';
            ws.current.send(JSON.stringify({ type: 'setUser', name: userName.current, userID: userID, team: team }));
        };

        
        
        ws.current.onmessage = (message) => {
            console.log('Received message from server:', message.data);
            const receivedUsers = JSON.parse(message.data);
            setUsers(receivedUsers);
        };

        ws.current.onclose = () => {
            console.log('Disconnected from the server');
        };

        return () => {
            if(ws.current.readyState === 1)
                ws.current.close();
        };
    }, [userName]);

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