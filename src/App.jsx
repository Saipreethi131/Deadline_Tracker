import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import Kanban from './pages/Kanban';
import Achievements from './pages/Achievements';
import { useState, useEffect } from 'react';

function AppContent({ isDarkMode, toggleTheme }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Mobile Navbar */}
      {!isAuthPage && <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}

      {/* Desktop Sidebar */}
      {!isAuthPage && <Sidebar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}

      <div className={`flex-grow ${!isAuthPage ? 'md:pl-64 pt-16 md:pt-0' : ''}`}>
        {/* The pt-16 is for mobile (Navbar height usually 16), on desktop pt-0 */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/achievements" element={<Achievements />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <ToastContainer position="bottom-right" theme={isDarkMode ? "dark" : "colored"} autoClose={3000} />
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference or localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'}>
      <Router>
        <AuthProvider>
          <AppContent isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
