import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MainView from './vues/MainView';
import WaitingRoom from './vues/WaitingRoom';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
      </Routes>
    </Router>
  );
}

export default App;