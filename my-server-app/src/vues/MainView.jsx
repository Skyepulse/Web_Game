import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; //useNavigate is a hook that gives you access to the history instance that you may use to navigate.

function MainView() {
    const [name, setName] = useState('');
    const [master] = useState(true); //We will use this to determine if the user is the master of the room
    const ws = useRef(null);
    let history = useNavigate();
    const serverURL = process.env.REACT_APP_SERVER1_URL.replace(/^http/, 'ws');

    useEffect(() => {
        ws.current = new WebSocket(serverURL); //Matches server.js

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
            function sendMessageOnReady(){
                if(ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({ type: 'createRoom' }));
                } else {
                    setTimeout(sendMessageOnReady, 100);
                }
            }
            sendMessageOnReady();
        } else {
            alert('Please enter a name before playing.');
        }
    }


    return(
        <div className="App">
            <h1> 
                Wavelength Fan Game  
            </h1>
            <header className="App-header">
                <p>Hello, choose a Username to create a waiting room!!</p>
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