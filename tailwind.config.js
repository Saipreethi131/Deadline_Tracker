/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#4f46e5',
                secondary: '#6b7280',
                success: '#10b981',
                danger: '#ef4444',
                warning: '#f59e0b',
                dark: '#1f2937',
                light: '#f3f4f6',
                gray: {
                    950: '#0a0f1e',
                }
            },
            boxShadow: {
                'glow-indigo': '0 0 20px rgb(99 102 241 / 0.3)',
                'glow-purple': '0 0 20px rgb(168 85 247 / 0.3)',
            },
            animation: {
                'spin-slow': 'spin 1s linear infinite',
            }
        },
    },
    plugins: [],
}
