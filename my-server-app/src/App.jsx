import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MainView from './vues/MainView';
import WaitingRoom from './vues/WaitingRoom';
import JoinRoom from './vues/JoinRoom';
import './App.css';
import GameContainer from './vues/Game/GameContainer';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/room/:roomID" element={<WaitingRoom />} />
        <Route path="/" element={<MainView />} />
        <Route path="/join" element={<JoinRoom />} />
        <Route path="/game/:gameRoomID" element={<GameContainer/>}/>
      </Routes>
    </Router>
  );
}

export default App;