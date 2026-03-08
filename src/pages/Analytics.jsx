import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip,
    AreaChart, Area, Tooltip as AreaTooltip,
    RadialBarChart, RadialBar,
} from 'recharts';
import {
    FaChartPie, FaChartBar, FaChartLine, FaFire,
    FaCheckCircle, FaClock, FaExclamationTriangle, FaListAlt,
    FaCalendarAlt, FaFlag,
} from 'react-icons/fa';
import analyticsService from '../services/analyticsService';
import Loader from '../components/Loader';

/* ─── tiny helpers ─────────────────────────────────────── */
const PRIORITY_COLOR = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const CATEGORY_COLORS = ['#4f46e5', '#7c3aed', '#0ea5e9', '#f59e0b', '#ec4899'];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className={`rounded-2xl p-5 border ${color.bg} ${color.border} flex items-center gap-4`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color.icon}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-bold ${color.text}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Icon size={15} />
        </div>
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h2>
    </div>
);

const ChartCard = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm p-5 ${className}`}>
        {children}
    </div>
);

const CustomTooltipStyle = {
    backgroundColor: 'rgba(17,24,39,0.85)',
    border: 'none',
    borderRadius: '10px',
    color: '#f9fafb',
    fontSize: '12px',
    padding: '8px 12px',
};

/* ─── Analytics Page ────────────────────────────────────── */
const Analytics = () => {
    const [data, setData] = useState({
        summary: null,
        byCategory: [],
        byPriority: [],
        timeline: [],
        upcoming: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [summary, byCategory, byPriority, timeline, upcoming] = await Promise.all([
                    analyticsService.getSummary(),
                    analyticsService.getByCategory(),
                    analyticsService.getByPriority(),
                    analyticsService.getTimeline(),
                    analyticsService.getUpcoming(),
                ]);
                setData({ summary, byCategory, byPriority, timeline, upcoming });
            } catch (err) {
                console.error('Failed to load analytics', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return <Loader />;

    const { summary, byCategory, byPriority, timeline, upcoming } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pb-16">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Header */}
                <div className="mb-8 animate-fade-in-down">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📊 <span className="gradient-text">Analytics</span>
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Insights across all your deadlines
                    </p>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 animate-fade-in-up">
                    <StatCard icon={FaListAlt} label="Total" value={summary?.total ?? 0} color={{ bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-700/30', icon: 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' }} />
                    <StatCard icon={FaClock} label="Pending" value={summary?.pending ?? 0} color={{ bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-700/30', icon: 'bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300' }} />
                    <StatCard icon={FaCheckCircle} label="Completed" value={summary?.completed ?? 0} color={{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-700/30', icon: 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' }} />
                    <StatCard icon={FaExclamationTriangle} label="Overdue" value={summary?.overdue ?? 0} color={{ bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-700/30', icon: 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400', text: 'text-red-700 dark:text-red-300' }} />
                    <StatCard icon={FaFire} label="Done Rate" value={`${summary?.completionRate ?? 0}%`} sub="completion rate" color={{ bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-700/30', icon: 'bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400', text: 'text-purple-700 dark:text-purple-300' }} />
                </div>

                {/* ── Row 1: Pie + Radial ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

                    {/* Completion Breakdown — Pie */}
                    <ChartCard>
                        <SectionTitle icon={FaChartPie} title="Completion Breakdown" />
                        {summary?.total > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Completed', value: summary.completed, fill: '#10b981' },
                                            { name: 'Pending', value: summary.pending, fill: '#f59e0b' },
                                            { name: 'Overdue', value: summary.overdue, fill: '#ef4444' },
                                        ]}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {[0, 1, 2].map(i => <Cell key={i} />)}
                                    </Pie>
                                    <PieTooltip contentStyle={CustomTooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart />
                        )}
                    </ChartCard>

                    {/* Priority Split — Radial */}
                    <ChartCard>
                        <SectionTitle icon={FaFlag} title="Priority Distribution" />
                        {byPriority.some(p => p.value > 0) ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <RadialBarChart
                                    cx="50%" cy="50%"
                                    innerRadius={30} outerRadius={100}
                                    barSize={14}
                                    data={byPriority}
                                >
                                    <RadialBar
                                        minAngle={15}
                                        background={{ fill: 'transparent' }}
                                        dataKey="value"
                                        label={{ position: 'insideStart', fill: '#fff', fontSize: 11 }}
                                    >
                                        {byPriority.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </RadialBar>
                                    <Legend
                                        iconSize={10}
                                        wrapperStyle={{ fontSize: '12px' }}
                                        formatter={(v) => v}
                                    />
                                    <PieTooltip contentStyle={CustomTooltipStyle} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart />
                        )}
                    </ChartCard>
                </div>

                {/* ── Row 2: Bar Chart ── */}
                <ChartCard className="mb-5">
                    <SectionTitle icon={FaChartBar} title="Deadlines by Category" />
                    {byCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={byCategory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <BarTooltip contentStyle={CustomTooltipStyle} cursor={{ fill: 'rgba(79,70,229,0.05)' }} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]} fill="#4f46e5" />
                                <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]} fill="#10b981" />
                                <Bar dataKey="pending" name="Pending" radius={[6, 6, 0, 0]} fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart />
                    )}
                </ChartCard>

                {/* ── Row 3: Area Chart + Upcoming ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* Monthly Timeline — Area */}
                    <ChartCard className="lg:col-span-2">
                        <SectionTitle icon={FaChartLine} title="Activity Over Time (Monthly)" />
                        {timeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={timeline} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <AreaTooltip contentStyle={CustomTooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="total" name="Total" stroke="#4f46e5" strokeWidth={2} fill="url(#gradTotal)" dot={{ r: 3, fill: '#4f46e5' }} />
                                    <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradDone)" dot={{ r: 3, fill: '#10b981' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart />
                        )}
                    </ChartCard>

                    {/* Upcoming Deadlines */}
                    <ChartCard>
                        <SectionTitle icon={FaCalendarAlt} title="Due This Week" />
                        {upcoming.length > 0 ? (
                            <div className="space-y-3">
                                {upcoming.map((d) => {
                                    const days = differenceInDays(new Date(d.deadlineDate), new Date());
                                    const urgency =
                                        days === 0 ? 'text-red-500' :
                                            days <= 2 ? 'text-orange-500' :
                                                'text-indigo-500';
                                    return (
                                        <div key={d._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${d.priority === 'high' ? 'bg-red-500' :
                                                    d.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{d.title}</p>
                                                <p className="text-xs text-gray-400">{format(new Date(d.deadlineDate), 'MMM dd, yyyy')}</p>
                                            </div>
                                            <span className={`text-xs font-bold shrink-0 ${urgency}`}>
                                                {days === 0 ? 'Today!' : `${days}d`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <FaCheckCircle className="text-emerald-400 mb-2" size={28} />
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">All clear!</p>
                                <p className="text-xs text-gray-400 mt-1">No deadlines in the next 7 days</p>
                            </div>
                        )}
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

const EmptyChart = () => (
    <div className="flex flex-col items-center justify-center h-48 text-center">
        <FaChartBar className="text-gray-200 dark:text-gray-700 mb-2" size={32} />
        <p className="text-sm text-gray-400 dark:text-gray-500">No data yet — add some deadlines!</p>
    </div>
);

export default Analytics;
