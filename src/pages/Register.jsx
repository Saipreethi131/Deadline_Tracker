import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaClock } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import CustomGoogleAuth from '../components/CustomGoogleAuth';
import { toast } from 'react-toastify';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const { name, email, password, confirmPassword } = formData;
    const { register, googleLogin, user, loading } = useAuth();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await googleLogin(credentialResponse.credential);
        } catch (error) {
            console.error(error);
        }
    };

    const handleGoogleError = () => {
        toast.error('Google Sign-In failed.');
    };

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const onChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setSubmitting(true);
        try {
            await register({ name, email, password });
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    const fields = [
        { id: 'reg-name', name: 'name', type: 'text', icon: FaUser, placeholder: 'Your full name', label: 'Full Name', value: name },
        { id: 'reg-email', name: 'email', type: 'email', icon: FaEnvelope, placeholder: 'you@example.com', label: 'Email address', value: email },
        { id: 'reg-password', name: 'password', type: 'password', icon: FaLock, placeholder: '••••••••', label: 'Password', value: password },
        { id: 'reg-confirm', name: 'confirmPassword', type: 'password', icon: FaLock, placeholder: '••••••••', label: 'Confirm Password', value: confirmPassword },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/30 px-4 py-12">

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2.5 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-300/50 dark:shadow-indigo-700/50 transition-all duration-300">
                            <FaClock className="text-white text-xl" />
                        </div>
                        <span className="text-3xl font-extrabold gradient-text">DeadlinePro</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create an account</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">Start tracking your deadlines today</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-100 dark:border-gray-700/60 p-8">
                    <form onSubmit={onSubmit} className="space-y-4">
                        {fields.map(({ id, name, type, icon: Icon, placeholder, label, value }) => (
                            <div key={name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <Icon size={13} />
                                    </div>
                                    <input
                                        id={id}
                                        name={name}
                                        type={type}
                                        required
                                        value={value}
                                        onChange={onChange}
                                        placeholder={placeholder}
                                        className="form-input pl-9 pr-3.5"
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            id="register-submit"
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full mt-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {submitting ? 'Creating account...' : (
                                <>Create Account <FaArrowRight size={13} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center">
                        <div className="border-t border-gray-200 dark:border-gray-700/60 w-full"></div>
                        <span className="bg-white dark:bg-gray-800 px-4 text-xs text-gray-400 font-medium tracking-wider uppercase">or</span>
                        <div className="border-t border-gray-200 dark:border-gray-700/60 w-full"></div>
                    </div>

                    <div className="mt-6 flex justify-center w-full">
                        <CustomGoogleAuth mode="signup" />
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
