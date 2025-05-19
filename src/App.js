import React from 'react';
// Import these components individually
import { HashRouter } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes as you develop them */}
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;