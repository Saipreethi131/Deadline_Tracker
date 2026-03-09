import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FaUser, FaEnvelope, FaLock, FaSave, FaShieldAlt,
    FaTrashAlt, FaExclamationTriangle, FaBell, FaCalendarAlt,
    FaCheckCircle, FaKey, FaChevronDown, FaPalette, FaMoon, FaSun,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import deadlineService from '../services/deadlineService';
import Loader from '../components/Loader';

const SectionCard = ({ icon: Icon, title, description, children, danger, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${danger
            ? 'border-red-200 dark:border-red-500/30'
            : 'border-gray-100 dark:border-gray-700/60'
            }`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-6 py-4 flex items-center justify-between transition-colors ${danger
                    ? 'bg-red-50/50 dark:bg-red-500/5 hover:bg-red-50 dark:hover:bg-red-500/10'
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger
                        ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        }`}>
                        <Icon size={16} />
                    </div>
                    <div>
                        <h2 className={`text-sm font-bold ${danger ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-white'
                            }`}>{title}</h2>
                        {description && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
                        )}
                    </div>
                </div>
                <div className={`text-gray-400 dark:text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                    <FaChevronDown size={14} />
                </div>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className={`px-6 py-5 border-t ${danger ? 'border-red-100 dark:border-red-500/20' : 'border-gray-100 dark:border-gray-700/60'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const Settings = ({ isDarkMode, toggleTheme }) => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reminderStatus, setReminderStatus] = useState(null);
    const [requiresPasswordForSensitiveActions, setRequiresPasswordForSensitiveActions] = useState(true);

    // Profile form
    const [profileData, setProfileData] = useState({ name: '', email: '', createdAt: null });
    const [savingProfile, setSavingProfile] = useState(false);

    // OTP Verification
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [verifyingOTP, setVerifyingOTP] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);

    // Delete account
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [profile, reminder] = await Promise.all([
                    authService.getProfile(),
                    deadlineService.getReminderStatus().catch(() => null),
                ]);
                setProfileData({ name: profile.name, email: profile.email, createdAt: profile.createdAt });
                setRequiresPasswordForSensitiveActions(profile.hasPassword !== false);
                setReminderStatus(reminder);
            } catch {
                toast.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // ─── Profile Update ───
    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!profileData.name.trim() || !profileData.email.trim()) {
            toast.error('Name and email are required');
            return;
        }
        setSavingProfile(true);
        try {
            const updated = await authService.updateProfile(profileData);
            if (updated.requiresVerification) {
                toast.success(updated.message);
                setShowOTPModal(true);
            } else {
                updateUser(updated);
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to update profile';
            toast.error(msg);
        } finally {
            setSavingProfile(false);
        }
    };

    // ─── OTP Verification ───
    const handleVerifyOTP = async () => {
        if (!otpValue || otpValue.length < 6) {
            toast.error('Please enter the 6-digit code');
            return;
        }
        setVerifyingOTP(true);
        try {
            const updated = await authService.verifyEmailChange({ otp: otpValue });
            updateUser(updated);

            // Sync local profile data to the newly updated email state
            setProfileData(p => ({ ...p, email: updated.email }));

            toast.success('Email successfully updated!');
            setShowOTPModal(false);
            setOtpValue('');
        } catch (error) {
            const msg = error.response?.data?.message || 'Verification failed';
            toast.error(msg);
        } finally {
            setVerifyingOTP(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;

        try {
            const updated = await authService.updateProfile(profileData);
            if (updated.requiresVerification) {
                toast.success('New verification code sent!');
                setResendTimer(60);
                setOtpValue('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend code');
        }
    };

    // ─── Password Change ───
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (requiresPasswordForSensitiveActions && !passwordData.currentPassword) {
            toast.error('Please provide your current password');
            return;
        }
        setSavingPassword(true);
        try {
            await authService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Password updated successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to change password';
            toast.error(msg);
        } finally {
            setSavingPassword(false);
        }
    };

    // ─── Delete Account ───
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            if (!requiresPasswordForSensitiveActions) {
                // OAuth-only accounts can delete without password.
                setDeleting(true);
                try {
                    await authService.deleteAccount('');
                    toast.success('Account deleted. Goodbye! 👋');
                    logout();
                    navigate('/login');
                } catch (error) {
                    const msg = error.response?.data?.message || 'Failed to delete account';
                    toast.error(msg);
                } finally {
                    setDeleting(false);
                }
                return;
            }
            toast.error('Please enter your password to confirm');
            return;
        }
        setDeleting(true);
        try {
            await authService.deleteAccount(deletePassword);
            toast.success('Account deleted. Goodbye! 👋');
            logout();
            navigate('/login');
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to delete account';
            toast.error(msg);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pb-16">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">

                {/* Page Header */}
                <div className="mb-8 animate-fade-in-down">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ⚙️ <span className="gradient-text">Settings</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage your profile, password, and preferences
                    </p>
                </div>

                <div className="space-y-6 animate-fade-in-up">

                    {/* ─── Profile Section ─── */}
                    <SectionCard
                        icon={FaUser}
                        title="Profile Information"
                        description="Update your name and email address"
                    >
                        <form onSubmit={handleProfileSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaUser size={13} />
                                    </div>
                                    <input
                                        id="settings-name"
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))}
                                        className="form-input pl-9 pr-3.5"
                                        placeholder="Your full name"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaEnvelope size={13} />
                                    </div>
                                    <input
                                        id="settings-email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))}
                                        className="form-input pl-9 pr-3.5"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    id="save-profile-btn"
                                    type="submit"
                                    disabled={savingProfile}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaSave size={12} />
                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </SectionCard>

                    {/* ─── Email Reminders Status ─── */}
                    <SectionCard
                        icon={FaBell}
                        title="Email Reminders"
                        description="Reminder schedule and configuration status"
                    >
                        {reminderStatus ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${reminderStatus.emailConfigured
                                        ? 'bg-emerald-500 shadow-emerald-300/50 shadow-sm'
                                        : 'bg-amber-500 shadow-amber-300/50 shadow-sm'
                                        }`} />
                                    <span className={`text-sm font-semibold ${reminderStatus.emailConfigured
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-amber-700 dark:text-amber-400'
                                        }`}>
                                        {reminderStatus.emailConfigured
                                            ? 'Email reminders are active'
                                            : 'Email reminders not configured'
                                        }
                                    </span>
                                </div>

                                {reminderStatus.emailConfigured ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Active Reminders</p>
                                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                    {reminderStatus.remindersEnabledCount}
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Check Frequency</p>
                                                <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
                                                    Daily
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700/60">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                <FaCalendarAlt className="inline mr-1.5" size={10} />
                                                Reminder Schedule
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {reminderStatus.schedule.map((s, i) => (
                                                    <span key={i} className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                📬 Checked daily at 8:00 AM IST
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            To enable email reminders, set <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-xs font-mono">EMAIL_USER</code> and{' '}
                                            <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-xs font-mono">EMAIL_PASS</code> in your <span className="font-semibold">backend/.env</span> file.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500">Unable to fetch reminder status.</p>
                        )}
                    </SectionCard>

                    {/* ─── Account Info ─── */}
                    <SectionCard
                        icon={FaShieldAlt}
                        title="Account Info"
                        description="Your account details"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                                <p className="text-xs text-gray-400 font-medium mb-1">Account ID</p>
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-300 truncate">{user?._id}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                                <p className="text-xs text-gray-400 font-medium mb-1">Member Since</p>
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    {profileData.createdAt
                                        ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                        : '—'
                                    }
                                </p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ─── Change Password ─── */}
                    <SectionCard
                        icon={FaKey}
                        title={requiresPasswordForSensitiveActions ? 'Change Password' : 'Set Password'}
                        description={
                            requiresPasswordForSensitiveActions
                                ? 'Update your login password'
                                : 'Create a password to enable manual email/password login'
                        }
                    >
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {!requiresPasswordForSensitiveActions && (
                                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300">
                                    Your account currently uses Google sign-in only. Set a password below if you also want to sign in manually with email and password.
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaLock size={13} />
                                    </div>
                                    <input
                                        id="current-password"
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                                        className="form-input pl-9 pr-3.5"
                                        placeholder="••••••••"
                                        required={requiresPasswordForSensitiveActions}
                                        disabled={!requiresPasswordForSensitiveActions}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                                        className="form-input px-3.5"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        id="confirm-new-password"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                                        className="form-input px-3.5"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    id="change-password-btn"
                                    type="submit"
                                    disabled={savingPassword}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaLock size={12} />
                                    {savingPassword ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </SectionCard>

                    {/* ─── Themes / Preferences ─── */}
                    <SectionCard
                        icon={FaPalette}
                        title="Display & Theme"
                        description="Customize how DeadlinePro looks"
                    >
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Dark Mode</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    Switch between light and dark themes
                                </p>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isDarkMode
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'
                                    }`}
                            >
                                {isDarkMode ? (
                                    <>
                                        <FaSun size={14} />
                                        <span>Light Mode</span>
                                    </>
                                ) : (
                                    <>
                                        <FaMoon size={14} />
                                        <span>Dark Mode</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </SectionCard>

                    {/* ─── Delete Account ─── */}
                    <SectionCard
                        icon={FaExclamationTriangle}
                        title="Delete Account"
                        description="Warning: Account cannot be recovered once deleted"
                        danger
                    >
                        {!showDeleteConfirm ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Delete Account</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Permanently delete your account and all deadlines. This cannot be undone.
                                    </p>
                                </div>
                                <button
                                    id="show-delete-btn"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl border border-red-200 dark:border-red-500/30 transition-all"
                                >
                                    <FaTrashAlt size={12} />
                                    Delete Account
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                    <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-1">
                                        ⚠️ Are you absolutely sure?
                                    </p>
                                    <p className="text-xs text-red-600/70 dark:text-red-400/70">
                                        This will permanently delete your account and all your deadlines. Enter your password to confirm.
                                    </p>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                                        <FaLock size={13} />
                                    </div>
                                    {requiresPasswordForSensitiveActions ? (
                                        <input
                                            id="delete-password"
                                            type="password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className="form-input pl-9 pr-3.5"
                                            placeholder="Enter your password to confirm"
                                        />
                                    ) : (
                                        <div className="form-input pl-9 pr-3.5 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            This account uses Google sign-in. No password confirmation is required.
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        id="confirm-delete-btn"
                                        onClick={handleDeleteAccount}
                                        disabled={deleting || (requiresPasswordForSensitiveActions && !deletePassword)}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <FaTrashAlt size={12} />
                                        {deleting ? 'Deleting...' : 'Delete Forever'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                </div>
            </div>

            {/* OTP Verification Modal */}
            {showOTPModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
                        <div className="flex justify-center mb-5">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                <FaEnvelope size={24} />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">
                            Verify Your Email
                        </h2>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                            We've sent a 6-digit verification code to <span className="font-semibold">{profileData.email}</span>. Please enter it below to confirm your new email.
                        </p>

                        <input
                            type="text"
                            maxLength="6"
                            placeholder="000 000"
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))} // only allow digits
                            className="form-input text-center text-2xl font-mono tracking-[0.5em] h-14 mb-2"
                        />

                        <div className="text-center mb-6">
                            <button
                                onClick={handleResendOTP}
                                disabled={resendTimer > 0}
                                className={`text-xs font-semibold ${resendTimer > 0 ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-700'}`}
                            >
                                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive a code? Resend"}
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOTPModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={verifyingOTP || otpValue.length < 6}
                                className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {verifyingOTP ? 'Verifying...' : 'Verify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
