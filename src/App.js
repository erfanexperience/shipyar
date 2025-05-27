import React from 'react';
// Import these components individually
import { HashRouter } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';
import ShipperSearchResults from './pages/ShipperSearchResults';
import TravelerSearchResults from './pages/TravelerSearchResults';


function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shipper-search-results" element={<ShipperSearchResults />} />
            <Route path="/traveler-search-results" element={<TravelerSearchResults />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;