import React from 'react';
// Import these components individually
import { BrowserRouter } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Route } from 'react-router-dom';
import NewHome from './pages/NewHome';
import './App.css';
import ShipperSearchResults from './pages/ShipperSearchResults';
import TravelerSearchResults from './pages/TravelerSearchResults';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { AuthProvider } from './hooks/useAuth';
import Dashboard from './components/dashboard/Dashboard';
import CreateOrder from './components/orders/CreateOrder';
import CreateOrderFromAmazon from './components/orders/CreateOrderFromAmazon';
import OrderList from './components/orders/OrderList';
import BrowseOrders from './components/orders/BrowseOrders';
import OrderDetails from './components/orders/OrderDetails';
import MyOffers from './components/offers/MyOffers';
import OfferDetails from './components/offers/OfferDetails';


function App() {
  // Determine basename based on environment
  // In production (GitHub Pages), use /shipyar
  // In development, use root /
  const basename = process.env.NODE_ENV === 'production' ? '/shipyar' : '/';
  
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <div className="app-container">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<NewHome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/shipper-search-results" element={<ShipperSearchResults />} />
              <Route path="/traveler-search-results" element={<TravelerSearchResults />} />
              
              {/* New routes for order management */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders/create" element={<CreateOrder />} />
              <Route path="/orders/create-from-amazon" element={<CreateOrderFromAmazon />} />
              <Route path="/orders/my" element={<OrderList asShopper={true} />} />
              <Route path="/deliveries/my" element={<OrderList asShopper={false} />} />
              <Route path="/orders/browse" element={<BrowseOrders />} />
              <Route path="/orders/:orderId" element={<OrderDetails />} />
              <Route path="/offers/my" element={<MyOffers />} />
              <Route path="/offers/:orderId" element={<OfferDetails />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;