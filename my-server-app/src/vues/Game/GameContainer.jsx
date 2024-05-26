import {useRef, useState, useEffect} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {PhaserGame} from './PhaserGame';
import {EventBus} from './EventBus';



function GameContainer(){
    const phaserRef = useRef();
    const [users, setUsers] = useState([]);
    const [leftUsers, setLeftUsers] = useState([]); 
    const [scores, setScores] = useState({red: 0, blue: 0, coop: 0});
    const [logs, setLogs] = useState([]); // [ {username: 'user1', team: 'blue', message: 'message1'}, {username: 'user2', team = 'red', message: 'message2'} ] 
    const gameRoomID = useRef();
    const gameTypeRef = useRef();
    const location = useLocation();
    const history = useNavigate();
    const userID = useRef();
    const ws = useRef(null);
    const chatBoxRef = useRef(null);
    const [cardTexts, setCardTexts] = useState({text1: 'loading...', text2: 'loading...'});
    const gameServerUrl = process.env.REACT_APP_GAMESERVER_URL.replace(/^http/, 'ws');

    const loadGameSession = () => {
        const gameSessionData = location.state || JSON.parse(localStorage.getItem('gameSession'));
        if(!gameSessionData) {
            history('/');
            return;
        } else {
            gameRoomID.current = gameSessionData.gameRoomID;
            userID.current = gameSessionData.userID;
            gameTypeRef.current = gameSessionData.gameType;
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
            if(message.type === 'cards'){
                ws.current.send(JSON.stringify({
                    type: 'cards',
                    gameRoomID: gameRoomID.current,
                    cards: message.cards
                }));
            }
        }
    }

    const sendLog = () => {
        const chatInput = document.getElementById('chatInput');
        if(chatInput.value.length > 0){
            ws.current.send(JSON.stringify({
                type: 'newLog',
                gameRoomID: gameRoomID.current,
                message: chatInput.value
            }));
            chatInput.value = '';
        }
    }

    useEffect(loadGameSession, [location.state, history]);

    useEffect(() => {
        ws.current = new WebSocket(gameServerUrl);
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
                if(response.type === 'yourTurn') {
                    EventBus.emit('your-turn');
                }
                if(response.type === 'yourGuessTurn'){
                    EventBus.emit('your-guess-turn');
                }
                if(response.type === 'error') {
                    console.error(response.message);
                    alert(response.message);
                    history('/');
                }
                if(response.type === 'updateScores'){
                    setScores(response.scores);
                }
                if(response.type === 'revealScore'){
                    EventBus.emit('reveal-score', response);
                }
                if(response.type === 'newCard'){
                    setCardTexts(response.cardTexts);
                }
                if(response.type === 'updateLogs'){
                    setLogs(response.logs);
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
    }, [location.state, history, gameServerUrl]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if(event.key === 'Enter'){
                sendLog();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if(chatBoxRef.current){
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [logs]);

    if(gameTypeRef.current === 'coop') return(
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
                    <div className='teamGame' id = 'teamCoop'>
                        <h2>Your team</h2>
                        <ol className='teamlist' id = 'team2list'>
                            {users.map(user => (
                                <li className = 'teamNameListElement' key={user.id} style = {{color: user.master ? 'green': 'inherit'}}><span>{user.name}</span></li>
                            ))}
                            {leftUsers.filter(user => user.team === 'red').map(user => (
                                <li className = 'teamNameListElementLeft' key={user.id} style = {{color: user.master ? 'green': 'grey'}}><span>{user.name}</span></li>
                            ))}
                        </ol>
                        <h3>Points: {scores.coop}</h3>
                    </div>
                </div>
                <div className='chat'>
                    <div className='chatBox' ref={chatBoxRef}>
                        {logs.map((log, index) => (
                            <div className='chatMessage' key={index}>
                                <span style={{color: log.color}}>{log.username}</span>
                                <span style={{color: log.messageColor}}>: {log.message}</span>
                            </div>
                        ))}
                    </div>
                    <div className = 'inputContainer'>
                        <input type='text' id='chatInput' placeholder='Type to write in chat...'/>
                        <div className ='sendButton' 
                            onClick = {sendLog}>Send</div>
                    </div>
                </div>
                <div className='cardTexts'>
                    <h2>Current Round Card</h2>
                    <div className='cardText'>
                        <div className = 'cardT' id = 't1'>{cardTexts.text1}</div>
                        <div className = 'lineSeparator'></div>
                        <div className = 'cardT' id = 't2'>{cardTexts.text2}</div>
                    </div>
                </div>
            </div>
        </div>
    );

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
                    <div className='teamGame' id = 'team1'>
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
                    <div className='teamGame' id = 'team2'>
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
                <div className='chat'>
                    <div className='chatBox' ref={chatBoxRef}>
                        {logs.map((log, index) => (
                            <div className='chatMessage' key={index}>
                                <span style={{color: log.color}}>{log.username}</span>
                                <span style={{color: log.messageColor}}>: {log.message}</span>
                            </div>
                        ))}
                    </div>
                    <div className = 'inputContainer'>
                        <input type='text' id='chatInput' placeholder='Type to write in chat...'/>
                        <div className ='sendButton' 
                            onClick = {sendLog}>Send</div>
                    </div>
                </div>
                <div className='cardTexts'>
                    <h2>Current Round Card</h2>
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