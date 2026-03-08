import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaMoon, FaSun, FaClock, FaChartPie, FaTh, FaCog, FaCalendarAlt, FaColumns, FaTrophy } from 'react-icons/fa';

const Navbar = ({ isDarkMode, toggleTheme }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLink = (to, Icon, label) => {
        const active = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                    ${active
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700/60 dark:hover:text-indigo-400'
                    }`}
            >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
            </Link>
        );
    };

    return (
        <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/60 dark:border-gray-700/60 transition-colors duration-300 shadow-sm md:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo + Nav Links */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-300/50 dark:group-hover:shadow-indigo-700/50 transition-all duration-300">
                                <FaClock className="text-white text-sm" />
                            </div>
                            <span className="text-xl font-extrabold gradient-text">DeadlinePro</span>
                        </Link>

                        {/* Nav links — only when logged in */}
                        {user && (
                            <div className="flex items-center gap-1 ml-2">
                                {navLink('/', FaTh, 'Dashboard')}
                                {navLink('/analytics', FaChartPie, 'Analytics')}
                                {navLink('/calendar', FaCalendarAlt, 'Calendar')}
                                {navLink('/kanban', FaColumns, 'Board')}
                                {navLink('/achievements', FaTrophy, 'Rewards')}
                                {navLink('/settings', FaCog, 'Settings')}
                            </div>
                        )}
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-3">

                        {/* Theme Toggle */}
                        <button
                            id="theme-toggle"
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl text-gray-500 hover:text-amber-500 hover:bg-amber-50 dark:text-gray-400 dark:hover:text-amber-300 dark:hover:bg-gray-700/60 transition-all duration-200"
                            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDarkMode ? <FaSun size={17} /> : <FaMoon size={17} />}
                        </button>

                        {user ? (
                            <div className="flex items-center gap-3">
                                {/* User avatar + name */}
                                <div className="hidden sm:flex items-center gap-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl px-3.5 py-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold uppercase">
                                        {user.name?.charAt(0)}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user.name}</span>
                                </div>

                                {/* Logout */}
                                <button
                                    id="logout-btn"
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                                    title="Logout"
                                >
                                    <FaSignOutAlt size={15} />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-primary text-sm">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
