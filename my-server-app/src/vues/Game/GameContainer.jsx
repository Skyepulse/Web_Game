import {useRef, useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {PhaserGame} from './PhaserGame';



function GameContainer(){
    const phaserRef = useRef();
    const [users, setUsers] = useState([]);
    const [leftUsers, setLeftUsers] = useState([]); 
    const gameRoomID = useRef();
    const location = useLocation();
    const history = useNavigate();
    const userID = useRef();
    const ws = useRef(null);

    const startGame = () => {
        console.log('Game Button pressed: ', phaserRef.current.scene);
    }

    const loadGameSession = () => {
        const gameSessionData = location.state || JSON.parse(localStorage.getItem('gameSession'));
        if(!gameSessionData) {
            history('/');
            return;
        } else {
            gameRoomID.current = gameSessionData.gameRoomID;
            userID.current = gameSessionData.userID;
            setUsers(gameSessionData.users);
            localStorage.setItem('gameSession', JSON.stringify(gameSessionData));
        }
    };

    useEffect(loadGameSession, [location.state, history]);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:4001');
        ws.current.onopen = () => {
            function sendMessageOnReady(){
                if(ws.current.readyState === WebSocket.OPEN) {
                    ws.current.send(JSON.stringify({
                        type: 'userJoin',
                        userID: userID.current,
                        gameRoomID: gameRoomID.current
                    }));
                } else {
                    setTimeout(sendMessageOnReady, 100);
                }
            }
            sendMessageOnReady();
        };

        ws.current.onmessage = (message) => {
            try {
                const response = JSON.parse(message.data);
                if(response.type === 'updateUsers') {
                    setUsers(response.users);
                    if(response.leftUsers.length > 0) setLeftUsers(response.leftUsers);
                    else setLeftUsers([]);
                }
                if(response.type === 'error') {
                    console.error(response.message);
                    alert(response.message);
                    history('/');
                }
            } catch (error) {
                console.error('Error parsing message: ', error);
            }
        };

        ws.current.onclose = () => {
        }

        return () => {
            if(ws.current.readyState === 1)
                ws.current.close();
        }
    }, [location.state, history]);

    return(
        <div className='gameApp'>
            <PhaserGame currentActiveScene={currentGameScene} ref={phaserRef} startGame = {startGame}/>
            <div className='gameAppNext'>
                <div className='teamPoints'>
                    <div className='team' id = 'team1'>
                        <h2>Team Blue</h2>
                        <ol className='teamlist' id = 'team1list'>
                            {users.filter(user => user.team === 'blue').map(user => (
                                <li className = 'teamNameListElement' key={user.id}><span>{user.name}</span></li>
                            ))}
                            {leftUsers.filter(user => user.team === 'blue').map(user => (
                                <li className = 'teamNameListElementLeft' key={user.id}><span>{user.name}</span></li>
                            ))}
                        </ol>
                        <h3>Points: 0</h3>
                    </div>
                    <div className='team' id = 'team2'>
                        <h2>Team Red</h2>
                        <ol className='teamlist' id = 'team2list'>
                            {users.filter(user => user.team === 'red').map(user => (
                                <li className = 'teamNameListElement' key={user.id}><span>{user.name}</span></li>
                            ))}
                            {leftUsers.filter(user => user.team === 'red').map(user => (
                                <li className = 'teamNameListElementLeft' key={user.id}><span>{user.name}</span></li>
                            ))}
                        </ol>
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