import {useRef, useState, useEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {PhaserGame} from './PhaserGame';


function GameContainer(){
    const phaserRef = useRef();
    const [users, setUsers] = useState([]);
    const location = useLocation();

    useEffect(() => {
        if(location.state && location.state.users) {
            setUsers(location.state.users);
            console.log('Users: ', location.state.users);
        }
    }, [location.state]);

    return(
        <div className='gameApp'>
            <PhaserGame currentActiveScene={currentGameScene} ref={phaserRef} />
            <div className='gameAppNext'>
                <h1>Team points</h1>
                <div className='teamPoints'>
                    <div className='team' id = 'team1'>
                        <h2>Team 1</h2>
                        <ul className='teamlist' id = 'team1list'>
                            {users.filter(user => user.team === 'blue').map(user => (
                                <li key={user.id} style = {{color: 'blue'}}>{user.name}</li>
                            ))}
                        </ul>
                        <h3>Points: 0</h3>
                    </div>
                    <div className='team' id = 'team2'>
                        <h2>Team 2</h2>
                        <ul className='teamlist' id = 'team2list'>
                            {users.filter(user => user.team === 'red').map(user => (
                                <li key={user.id} style = {{color: 'red'}}>{user.name}</li>
                            ))}
                        </ul>
                        <h3>Points: 0</h3>
                    </div>
                </div>
            </div>
        </div>
    );
}

const currentGameScene = (scene) => {
    console.log('Current Scene: ', scene.scene.key);
}

export default GameContainer;