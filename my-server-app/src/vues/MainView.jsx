import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; //useNavigate is a hook that gives you access to the history instance that you may use to navigate.

function MainView() {
    const [name, setName] = useState('');
    const [master] = useState(true); //We will use this to determine if the user is the master of the room
    const ws = useRef(null);
    let history = useNavigate();

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:3001'); //Matches server.js

        ws.current.onopen = () => {
        };

        ws.current.onmessage = (message) => {
            const response = JSON.parse(message.data);

            if(response.type === 'error'){
                alert(response.message);
                history('/');
            }
            if(response.type === 'roomCreated') {
                localStorage.setItem('LastRoomID', response.roomID);
                history(`/room/${response.roomID}`, { state: { name, master } });
            }
        };

        ws.current.onclose = () => {
        };

        return () => {
            if(ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        }
    });

    const handlePlayClick = () => {
        if (name.trim()) { 
            ws.current.send(JSON.stringify({ type: 'createRoom' }));
        } else {
            alert('Please enter a name before playing.');
        }
    }


    return(
        <div className="App">
            <h1> 
                My web game name.  
            </h1>
            <header className="App-header">
                <p>Hello Choose a Name to create a waiting room!!</p>
                <input
                    type='text' 
                    placeholder='Enter your name...'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                 />
                <button onClick={() => {handlePlayClick()}}>Play</button>
            </header>
        </div>
    );
}

export default MainView;