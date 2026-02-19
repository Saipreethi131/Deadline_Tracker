import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950/30 text-center px-4">

            {/* 404 glowing number */}
            <div className="relative mb-6">
                <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-purple-400 dark:from-indigo-600 dark:to-purple-700 leading-none select-none">
                    404
                </div>
                <div className="absolute inset-0 text-[120px] font-black text-indigo-100 dark:text-indigo-900/30 leading-none blur-2xl select-none">
                    404
                </div>
            </div>

            <div className="flex items-center gap-2 text-amber-500 mb-3">
                <FaExclamationTriangle size={18} />
                <span className="text-sm font-semibold uppercase tracking-wider">Page Not Found</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Oops! Lost in time?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
                The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>

            <Link
                to="/"
                className="btn-primary shadow-lg shadow-indigo-300/30 dark:shadow-indigo-700/20 px-8 py-3"
            >
                <FaHome size={14} /> Go Home
            </Link>
        </div>
    );
};

export default NotFound;
