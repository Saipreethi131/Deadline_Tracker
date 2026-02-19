const Loader = () => {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-950 gap-4">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-gray-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin-slow"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium animate-pulse">Loading...</p>
        </div>
    );
};

export default Loader;
