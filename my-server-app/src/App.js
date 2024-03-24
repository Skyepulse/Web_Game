import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import MainView from './vues/MainView';
import WaitingRoom from './vues/WaitingRoom';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/room/:roomID" element={<WaitingRoom />} />
        <Route path="/" element={<MainView />} />
      </Routes>
    </Router>
  );
}

export default App;