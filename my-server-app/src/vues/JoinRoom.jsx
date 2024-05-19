import React, { useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';

function JoinRoom() {
    const [name, setName] = useState('');
    const ws = useRef(null);
    let history = useNavigate();
    const canJoin = useRef(false);
    const serverURL = process.env.REACT_APP_SERVER1_URL.replace(/^http/, 'ws');

    useEffect(() => {
        ws.current = new WebSocket(serverURL);
        
        ws.current.onopen = () => {
            if(!localStorage.getItem('LastRoomID')){
                alert('Please create a room first before joining');
                history('/');
            
            }
            ws.current.send(JSON.stringify({ type: 'roomExists', roomID: localStorage.getItem('LastRoomID') }));
        };

        ws.current.onmessage = (message) => {
            const response = JSON.parse(message.data);

            if(response.type === 'roomExists') {
                canJoin.current = true;
            } else if(response.type === 'roomNotFound') {
                alert('The room you are trying to join does not exist. Please create a room first.');
                history('/');
            }
        }

        ws.current.onclose = () => {
        };
    });

    const handlePlayClick = () => {
        if(!canJoin.current) 
            return;
        if (name.trim()) { 
            const roomID = localStorage.getItem('LastRoomID');
            localStorage.setItem('userName', name);
            history(`/room/${roomID}`, { state: { name } });
        } else {
            alert('Please enter a name before playing.');
        }
    }

    return(
        <div className="App">
            <header className="App-header" id='joinRoomHeader'>
                <p>Hello. To join the room choose a name!!</p>
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

export default JoinRoom;