import React from 'react';
// Import these components individually
import { HashRouter } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';
import ShipperSearchResults from './pages/ShipperSearchResults';
import TravelerSearchResults from './pages/TravelerSearchResults';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { AuthProvider } from './hooks/useAuth';


function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/shipper-search-results" element={<ShipperSearchResults />} />
              <Route path="/traveler-search-results" element={<TravelerSearchResults />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;