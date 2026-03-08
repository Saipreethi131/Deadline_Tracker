import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    FaTrophy, FaFire, FaStar, FaLock,
    FaBolt, FaMedal, FaChartLine,
} from 'react-icons/fa';
import gamificationService from '../services/gamificationService';
import Loader from '../components/Loader';

const Achievements = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const stats = await gamificationService.getGamificationStats();
                setData(stats);
            } catch {
                toast.error('Failed to load gamification stats');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <Loader />;
    if (!data) return null;

    const { stats, achievements, xp, streaks } = data;
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const xpProgress = xp.nextLevelXP > 0 ? (xp.currentXP / xp.nextLevelXP) * 100 : 100;

    // Level titles
    const levelTitles = ['Beginner', 'Starter', 'Achiever', 'Pro', 'Expert', 'Master', 'Legend', 'Mythic', 'Immortal', 'Transcendent'];
    const levelTitle = levelTitles[Math.min(xp.level - 1, levelTitles.length - 1)] || 'Transcendent';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Header */}
                <div className="mb-8 animate-fade-in-down">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        🏆 <span className="gradient-text">Achievements & Streaks</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Track your progress, earn XP, and unlock achievements
                    </p>
                </div>

                {/* ─── Hero Stats Card ─── */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-6 sm:p-8 mb-8 text-white shadow-xl shadow-indigo-300/20 dark:shadow-indigo-900/30 animate-fade-in-up overflow-hidden relative">
                    {/* Decorative circles */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />

                    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Level */}
                        <div className="text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl font-black border border-white/20">
                                    {xp.level}
                                </div>
                                <div>
                                    <p className="text-xs text-purple-200 font-semibold uppercase tracking-wider">Level</p>
                                    <p className="text-lg font-bold">{levelTitle}</p>
                                </div>
                            </div>
                            {/* XP Bar */}
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-purple-200 mb-1.5">
                                    <span>{xp.currentXP} XP</span>
                                    <span>{xp.nextLevelXP} XP</span>
                                </div>
                                <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(xpProgress, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-purple-200 mt-1.5 text-center sm:text-left">
                                    {xp.total} total XP earned
                                </p>
                            </div>
                        </div>

                        {/* Streak */}
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm mb-2 border border-white/20">
                                <FaFire className="text-orange-300" size={24} />
                            </div>
                            <p className="text-4xl font-black">{streaks.current}</p>
                            <p className="text-xs text-purple-200 font-semibold uppercase tracking-wider mt-0.5">Day Streak</p>
                            <p className="text-xs text-purple-300 mt-1">Best: {streaks.longest} days</p>
                        </div>

                        {/* Achievements */}
                        <div className="text-center sm:text-right">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm mb-2 border border-white/20">
                                <FaTrophy className="text-yellow-300" size={24} />
                            </div>
                            <p className="text-4xl font-black">{unlockedCount}<span className="text-lg text-purple-300">/{totalCount}</span></p>
                            <p className="text-xs text-purple-200 font-semibold uppercase tracking-wider mt-0.5">Achievements</p>
                            <p className="text-xs text-purple-300 mt-1">{totalCount - unlockedCount} remaining</p>
                        </div>
                    </div>
                </div>

                {/* ─── Quick Stats ─── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fade-in-up">
                    {[
                        { label: 'Completed', value: stats.totalCompleted, icon: '✅', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Early Finishes', value: stats.earlyCompletions, icon: '🐦', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { label: 'Categories', value: stats.categoriesCompleted, icon: '🎨', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                        { label: 'High Priority Done', value: stats.highPriorityCompleted, icon: '🔥', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-3.5 ${s.bg} border border-white/60 dark:border-gray-700/30`}>
                            <p className="text-sm mb-1">{s.icon}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ─── Achievements Grid ─── */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FaMedal className="text-amber-500" size={16} />
                        All Achievements
                    </h2>
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        {unlockedCount} of {totalCount} unlocked
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                    {achievements.map(ach => (
                        <div
                            key={ach.id}
                            className={`
                                relative rounded-2xl border p-4 transition-all duration-300
                                ${ach.unlocked
                                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                    : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/40 opacity-60'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0
                                    ${ach.unlocked
                                        ? 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-500/20 dark:to-yellow-500/20 shadow-sm'
                                        : 'bg-gray-100 dark:bg-gray-700/60 grayscale'
                                    }
                                `}>
                                    {ach.unlocked ? ach.icon : <FaLock className="text-gray-400" size={16} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className={`text-sm font-bold truncate ${ach.unlocked ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                            {ach.name}
                                        </h4>
                                        {ach.unlocked && (
                                            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full">
                                                ✓
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs ${ach.unlocked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'
                                        }`}>
                                        {ach.description}
                                    </p>
                                    <div className="mt-2">
                                        <span className={`
                                            inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full
                                            ${ach.unlocked
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-700/60 dark:text-gray-500'
                                            }
                                        `}>
                                            <FaStar size={8} /> {ach.xp} XP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default Achievements;
