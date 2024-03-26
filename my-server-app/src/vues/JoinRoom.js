import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';

function JoinRoom() {
    const [name, setName] = useState('');
    let history = useNavigate();

    const handlePlayClick = () => {
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
            <header className="App-header">
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