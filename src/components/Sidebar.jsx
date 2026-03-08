import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaMoon, FaSun, FaClock, FaChartPie, FaTh, FaCog, FaCalendarAlt, FaColumns, FaTrophy } from 'react-icons/fa';

const Sidebar = ({ isDarkMode, toggleTheme }) => {
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${active
                        ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-indigo-400'
                    }`}
            >
                <Icon size={18} />
                <span>{label}</span>
            </Link>
        );
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200/60 dark:border-gray-700/60 transition-colors duration-300 shadow-sm flex flex-col hidden md:flex">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 h-20 border-b border-gray-100 dark:border-gray-800">
                <Link to="/" className="flex items-center gap-2.5 group w-full">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-300/50 dark:group-hover:shadow-indigo-700/50 transition-all duration-300">
                        <FaClock className="text-white text-sm" />
                    </div>
                    <span className="text-xl font-extrabold gradient-text">DeadlinePro</span>
                </Link>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                {user ? (
                    <>
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 ml-2">Main</div>
                        {navLink('/', FaTh, 'Dashboard')}
                        {navLink('/analytics', FaChartPie, 'Analytics')}

                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-6 mb-2 ml-2">Features</div>
                        {navLink('/calendar', FaCalendarAlt, 'Calendar')}
                        {navLink('/kanban', FaColumns, 'Board')}
                        {navLink('/achievements', FaTrophy, 'Rewards')}

                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-6 mb-2 ml-2">App</div>
                        {navLink('/settings', FaCog, 'Settings')}
                    </>
                ) : (
                    <>
                        <div className="mt-4 px-2">
                            <Link to="/login" className="block w-full text-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 transition-colors mb-2">
                                Login
                            </Link>
                            <Link to="/register" className="btn-primary w-full text-sm block text-center">
                                Get Started
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                {/* Theme Toggle Removed */}

                {user && (
                    <div className="pt-2 border-t border-gray-50 dark:border-gray-800/50 mt-2">
                        {/* User info */}
                        <Link to="/settings" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-2 cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold uppercase shrink-0">
                                {user.name?.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{user.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                        </Link>

                        {/* Logout */}
                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                        >
                            <FaSignOutAlt size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
