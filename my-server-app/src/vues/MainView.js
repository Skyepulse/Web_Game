import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; //useNavigate is a hook that gives you access to the history instance that you may use to navigate.

function MainView() {
    const [name, setName] = useState('');

    let history = useNavigate();

    const handlePlayClick = () => {
        history('/waiting-room', {state: {name: name || ''}});
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