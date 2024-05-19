import {useRef, useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {PhaserGame} from './PhaserGame';
import {EventBus} from './EventBus';



function GameContainer(){
    const phaserRef = useRef();
    const [users, setUsers] = useState([]);
    const [leftUsers, setLeftUsers] = useState([]); 
    const [scores, setScores] = useState({red: 0, blue: 0});
    const gameRoomID = useRef();
    const location = useLocation();
    const history = useNavigate();
    const userID = useRef();
    const ws = useRef(null);
    const [cardTexts, setCardTexts] = useState({text1: 'Default', text2: 'Default'});

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

    const sendServerMessage = (message) => {
        if(ws.current.readyState === WebSocket.OPEN) {
            if(message.type === 'nextTurn') {
                ws.current.send(JSON.stringify({
                    type: 'nextTurn',
                    gameRoomID: gameRoomID.current
                }));
            }
            if(message.type === 'guessTurn'){
                ws.current.send(JSON.stringify({
                    type: 'guessTurn',
                    gameRoomID: gameRoomID.current,
                    mainCircleRotation: message.mainCircleRotation,
                    pointsRadius: message.pointsRadius
                }));
            }
            if(message.type === 'userGuess'){
                ws.current.send(JSON.stringify({
                    type: 'userGuess',
                    gameRoomID: gameRoomID.current,
                    guessRotation: message.guessRotation
                }));
            }
        }
    }

    useEffect(loadGameSession, [location.state, history]);

    useEffect(() => {
        ws.current = new WebSocket('ws://localhost:4001');
        ws.current.onopen = () => {
            function sendMessageOnReady(){
                if(ws.current.readyState === WebSocket.OPEN) {
                    console.log('Sending user join message with gameRoomID: ', gameRoomID.current, ' and userID: ', userID.current);
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
                if(response.type === 'yourTurn') {
                    console.log('Your turn received');
                    EventBus.emit('your-turn');
                }
                if(response.type === 'yourGuessTurn'){
                    console.log('Your guess turn');
                    EventBus.emit('your-guess-turn');
                }
                if(response.type === 'error') {
                    console.error(response.message);
                    alert(response.message);
                    history('/');
                }
                if(response.type === 'updateScores'){
                    setScores(response.scores);
                    console.log('Scores: ', response.scores); 
                }
                if(response.type === 'revealScore'){
                    EventBus.emit('reveal-score', response);
                }
                if(response.type === 'newCard'){
                    setCardTexts(response.cardTexts);
                    console.log('New card texts: ', response.cardTexts);
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
            <PhaserGame 
                ref={phaserRef} 
                //PASSED DOWN METHODS//
                currentActiveScene={currentGameScene} 
                sendServerMessage = {sendServerMessage}
                ///////////////////////
            />
            <div className='gameAppNext'>
                <div className='teamPoints'>
                    <div className='team' id = 'team1'>
                        <h2>Team Blue</h2>
                        <ol className='teamlist' id = 'team1list'>
                            {users.filter(user => user.team === 'blue').map(user => (
                                <li className = 'teamNameListElement' key={user.id} style = {{color: user.master ? 'green': 'inherit'}}><span>{user.name}</span></li>
                            ))}
                            {leftUsers.filter(user => user.team === 'blue').map(user => (
                                <li className = 'teamNameListElementLeft' key={user.id} style = {{color: user.master ? 'green': 'grey'}}><span>{user.name}</span></li>
                            ))}
                        </ol>
                        <h3>Points: {scores.blue}</h3>
                    </div>
                    <div className='team' id = 'team2'>
                        <h2>Team Red</h2>
                        <ol className='teamlist' id = 'team2list'>
                            {users.filter(user => user.team === 'red').map(user => (
                                <li className = 'teamNameListElement' key={user.id} style = {{color: user.master ? 'green': 'inherit'}}><span>{user.name}</span></li>
                            ))}
                            {leftUsers.filter(user => user.team === 'red').map(user => (
                                <li className = 'teamNameListElementLeft' key={user.id} style = {{color: user.master ? 'green': 'grey'}}><span>{user.name}</span></li>
                            ))}
                        </ol>
                        <h3>Points: {scores.red}</h3>
                    </div>
                </div>
                <div className='cardTexts'>
                    <h2>Card Texts</h2>
                    <div className='cardText'>
                        <div className = 'cardT' id = 't1'>{cardTexts.text1}</div>
                        <div className = 'lineSeparator'></div>
                        <div className = 'cardT' id = 't2'>{cardTexts.text2}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const currentGameScene = (scene) => {
    //console.log('Current Scene: ', scene.scene.key);
}



export default GameContainer;