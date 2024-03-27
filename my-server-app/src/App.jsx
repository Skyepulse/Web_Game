import React, { useRef } from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MainView from './vues/MainView';
import WaitingRoom from './vues/WaitingRoom';
import JoinRoom from './vues/JoinRoom';
import './App.css';
import { PhaserGame } from './vues/Game/PhaserGame';


function App() {
  const phaserRef = useRef();
  return (
    <Router>
      <Routes>
        <Route path="/room/:roomID" element={<WaitingRoom />} />
        <Route path="/" element={<MainView />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/game/:gameRoomID" element={<PhaserGame currentActiveScene={currentGameScene} ref={phaserRef}/>}/>
      </Routes>
    </Router>
  );
}

const currentGameScene = (scene) => {
  console.log('Current Scene: ', scene.scene.key);
}

export default App;