import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExplorePage from './pages/ExplorePage';
import CreatorProfilePage from './pages/CreatorProfilePage';
import RaffleDetailPage from './pages/RaffleDetailPage';
import DashboardPage from './pages/DashboardPage';
import MyTicketsPage from './pages/MyTicketsPage';
import AdminDashboard from './pages/AdminDashboard';
import RaffleManagementPage from './pages/RaffleManagementPage';
import MessagesPage from './pages/MessagesPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import CheckoutPage from './pages/CheckoutPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Axios interceptor for auth
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/explore" /> : <LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/explore" /> : <RegisterPage onLogin={handleLogin} />}
        />
        <Route
          path="/explore"
          element={<ExplorePage user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/creator/:creatorId"
          element={<CreatorProfilePage user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/raffle/:raffleId"
          element={<RaffleDetailPage user={user} onLogout={handleLogout} />}
        />
        <Route
          path="/dashboard"
          element={user && (user.role === 'creator' || user.role === 'admin') ? <DashboardPage user={user} onLogout={handleLogout} /> : <Navigate to="/explore" />}
        />
        <Route
          path="/my-tickets"
          element={user ? <MyTicketsPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user && user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/explore" />}
        />
        <Route
          path="/raffle/:raffleId/manage"
          element={user && (user.role === 'creator' || user.role === 'admin') ? <RaffleManagementPage user={user} /> : <Navigate to="/explore" />}
        />
        <Route
          path="/messages"
          element={user ? <MessagesPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile-settings"
          element={user ? <ProfileSettingsPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;