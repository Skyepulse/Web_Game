import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; //useNavigate is a hook that gives you access to the history instance that you may use to navigate.

function MainView() {
    const [name, setName] = useState('');
    const ws = useRef(null);
    let history = useNavigate();

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:3001'); //Matches server.js

        ws.current.onopen = () => {
            console.log('Connected to the server from MainView');
        };

        ws.current.onmessage = (message) => {
            const response = JSON.parse(message.data);

            if(response.type === 'roomCreated') {
                localStorage.setItem('LastRoomID', response.roomID);
                history(`/room/${response.roomID}`, { state: { name } });
            }
        };

        ws.current.onclose = () => {
            console.log('Connection closed from MainView');
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
            <header className="App-header">
                <p>Hello Choose a Name!!</p>
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