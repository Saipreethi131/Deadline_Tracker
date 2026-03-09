import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaKey, FaLock, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import authService from '../services/authService';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleRequestCode = async () => {
        if (!email.trim()) {
            toast.error('Please enter your email');
            return;
        }

        setSubmitting(true);
        try {
            const response = await authService.requestPasswordReset(email);
            toast.success(response.message || 'Reset code sent');
            setCodeSent(true);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send reset code';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp.trim()) {
            toast.error('Please enter the verification code');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setSubmitting(true);
        try {
            const response = await authService.resetPassword({
                email,
                otp,
                newPassword,
            });
            toast.success(response.message || 'Password reset successful');
            navigate('/login', { replace: true });
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/40 px-4 py-10">
            <div className="relative w-full max-w-md animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2.5 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-300/50 dark:shadow-indigo-700/50 transition-all duration-300">
                            <FaClock className="text-white text-xl" />
                        </div>
                        <span className="text-3xl font-extrabold gradient-text">DeadlinePro</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                        Use your email and verification code to set a new password.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/60 dark:shadow-gray-900/60 border border-gray-100 dark:border-gray-700/60 p-8 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                <FaEnvelope size={13} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="form-input pl-9 pr-3.5"
                            />
                        </div>
                    </div>

                    {!codeSent ? (
                        <button
                            type="button"
                            onClick={handleRequestCode}
                            disabled={submitting}
                            className="btn-primary w-full disabled:opacity-60"
                        >
                            {submitting ? 'Sending code...' : 'Send reset code'}
                        </button>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Verification code</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaKey size={13} />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 6-digit code"
                                        className="form-input pl-9 pr-3.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaLock size={13} />
                                    </div>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password"
                                        className="form-input pl-9 pr-3.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaLock size={13} />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm password"
                                        className="form-input pl-9 pr-3.5"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleRequestCode}
                                    disabled={submitting}
                                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
                                >
                                    Resend code
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    disabled={submitting}
                                    className="btn-primary flex-1 disabled:opacity-60"
                                >
                                    {submitting ? 'Resetting...' : 'Reset password'}
                                </button>
                            </div>
                        </>
                    )}

                    <Link
                        to="/login"
                        className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        <FaArrowLeft size={11} /> Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
