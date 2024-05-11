import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

function WaitingRoom() {
    const [users, setUsers] = useState([]);
    const [headerColor] = useState('black'); //We will use this to determine the color of the header [black, red, blue]
    const location = useLocation();
    const history = useNavigate();
    const {roomID} = useParams(); //We extract the roomID from the URL
    const userName = useRef(location.state?.name || 'Anonymous');
    const master = useRef(location.state?.master || false);
    const ws = useRef(null);
    const usersRef = useRef(users);

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

    const startGame = () => {
        if (ws.current && users.length > 1) {
            //We check that all users found a team SO no users has team 'none'
            if(users.find(user => user.team === 'none')) {
                alert('Some users have not chosen a team yet');
                return;
            }
            //We check each team has at least one player
            if(users.filter(user => user.team === 'red').length < 1 || users.filter(user => user.team === 'blue').length < 1) {
                alert('Each team must have at least one player');
                return;
            }
            const me = users.find(user => user.id === localStorage.getItem('userID'));
            if(me.master) {
                ws.current.send(JSON.stringify({ type: 'startGame', roomID: roomID }));
            }
        } else if (users.length <= 1) {
            alert('You need at least 2 players to start the game');
        }
    };

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
            //We first check if we have entered this room before, if not we redirect to the main view
            if(localStorage.getItem('LastRoomID') !== roomID) {
                localStorage.clear();
                localStorage.setItem('LastRoomID', roomID);
                console.log('Redirecting to /join');
                history('/join');
            }
            if(!localStorage.getItem('userName')) {
                localStorage.setItem('userName', userName.current);
            } else {
                userName.current = localStorage.getItem('userName');
            }

            if(location.state?.name) {
                localStorage.setItem('userName', location.state.name);
                userName.current = location.state.name;
            }
            const team = localStorage.getItem('team') || 'none';
            ws.current.send(JSON.stringify({ type: 'setUser', name: userName.current, userID: userID, team: team, roomID: roomID, master: master.current}));
        };

        
        
        ws.current.onmessage = (message) => {
            const response = JSON.parse(message.data);
            if(response.type === 'updateUsers') {
                setUsers(response.users);
            }
            else if(response.type === 'error') {
                console.error(response.message);
                alert(response.message);
                localStorage.clear();
                history('/');
            } else if(response.type === 'startGame') {
                const gameRoomID = response.gameRoomID;
                const userID = localStorage.getItem('userID'); 
                history(`/game/${gameRoomID}`, {state: {users: usersRef.current, gameRoomID: gameRoomID, userID: userID}});
            }
        };

        ws.current.onclose = () => {
        };

        return () => {
            if(ws.current.readyState === 1)
                ws.current.close();
        };
    }, [roomID, history, location.state?.name, master]);

    useEffect(() => {
        usersRef.current = users;
    }, [users]);


    return (
        <div>
            <h2 style={{color: headerColor}}>Waiting Room</h2>
            <div id='teams'>
                <div id='red' className='team'>
                    <h3>Red Team</h3>
                    <ul>
                        {users.filter(user => user.team === 'red').map(user => (
                            <li key={user.id} style = {{color: user.master ? 'green': 'inherit'}}>{user.name}</li>
                        ))}
                    </ul>
                </div>
                <div id='none' className='team'>
                    <h3>Choose a team!</h3>
                    <ul>
                        {users.filter(user => user.team === 'none').map(user => (
                            <li key={user.id} style = {{color: user.master ? 'green': 'inherit'}}>{user.name}</li>
                        ))}
                    </ul>
                </div>
                <div id='blue' className='team'>
                    <h3>Blue Team</h3>
                    <ul>
                        {users.filter(user => user.team === 'blue').map(user => (
                            <li key={user.id} style = {{color: user.master ? 'green': 'inherit'}}>{user.name}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div id = 'TeamButtons'>
                <button id='joinRed' onClick={() =>{joinTeam('red')}}>Join Red</button>
                <button id='joinBlue' onClick={() =>{joinTeam('blue')}}>Join Blue</button>
            </div>
            <div id='startGameDiv'>
                <button id='startGame' onClick={() => {startGame()}}>Start Game</button>
            </div>
            <button id = 'Disconnect' onClick={() => {disconnect()}}>Disconnect</button>
        </div>
    );
}

export default WaitingRoom;