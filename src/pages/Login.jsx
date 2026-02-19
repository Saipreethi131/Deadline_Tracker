import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaArrowRight } from 'react-icons/fa';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { email, password } = formData;
    const { login, user, loading } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const onChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login({ email, password });
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/40 px-4">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-300/30 dark:shadow-indigo-700/30 mb-4">
                        <FaLock className="text-white text-xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Sign in to track your deadlines</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-100 dark:border-gray-700/60 p-8">
                    <form onSubmit={onSubmit} className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                    <FaEnvelope size={13} />
                                </div>
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={onChange}
                                    className="form-input pl-9 pr-3.5"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                    <FaLock size={13} />
                                </div>
                                <input
                                    id="login-password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={onChange}
                                    className="form-input pl-9 pr-3.5"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            id="login-submit"
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full mt-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {submitting ? 'Signing in...' : (
                                <>Sign in <FaArrowRight size={13} /></>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
