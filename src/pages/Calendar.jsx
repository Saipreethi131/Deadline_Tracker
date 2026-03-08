import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, isToday,
    differenceInDays,
} from 'date-fns';
import {
    FaChevronLeft, FaChevronRight, FaCalendarAlt,
    FaClock, FaCheck, FaExclamationTriangle, FaFlag,
} from 'react-icons/fa';
import deadlineService from '../services/deadlineService';
import Loader from '../components/Loader';
import AddDeadlineModal from '../components/AddDeadlineModal';

const CATEGORY_COLORS = {
    assignment: { bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    internship: { bg: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
    job: { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    hackathon: { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
    custom: { bg: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
};

const PRIORITY_BADGE = {
    high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Calendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeadline, setEditingDeadline] = useState(null);

    useEffect(() => {
        fetchDeadlines();
    }, []);

    const fetchDeadlines = async () => {
        try {
            setLoading(true);
            const data = await deadlineService.getDeadlines();
            setDeadlines(data);
        } catch {
            toast.error('Failed to fetch deadlines');
        } finally {
            setLoading(false);
        }
    };

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: calStart, end: calEnd });
    }, [currentMonth]);

    // Map deadlines by date key
    const deadlinesByDate = useMemo(() => {
        const map = {};
        deadlines.forEach(d => {
            const key = format(new Date(d.deadlineDate), 'yyyy-MM-dd');
            if (!map[key]) map[key] = [];
            map[key].push(d);
        });
        return map;
    }, [deadlines]);

    // Deadlines for selected date
    const selectedDateDeadlines = useMemo(() => {
        if (!selectedDate) return [];
        const key = format(selectedDate, 'yyyy-MM-dd');
        return deadlinesByDate[key] || [];
    }, [selectedDate, deadlinesByDate]);

    // Stats for current month
    const monthStats = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const inMonth = deadlines.filter(d => {
            const date = new Date(d.deadlineDate);
            return date >= monthStart && date <= monthEnd;
        });
        return {
            total: inMonth.length,
            pending: inMonth.filter(d => d.status === 'pending').length,
            completed: inMonth.filter(d => d.status === 'completed').length,
            overdue: inMonth.filter(d => {
                return differenceInDays(new Date(d.deadlineDate), new Date()) < 0 && d.status !== 'completed';
            }).length,
        };
    }, [deadlines, currentMonth]);

    const handleSaveDeadline = async (formData) => {
        try {
            if (editingDeadline) {
                const data = await deadlineService.updateDeadline(editingDeadline._id, formData);
                setDeadlines(prev => prev.map(d => d._id === editingDeadline._id ? data : d));
                toast.success('Deadline updated');
            } else {
                const data = await deadlineService.createDeadline(formData);
                setDeadlines(prev => [...prev, data]);
                toast.success('Deadline created');
            }
        } catch {
            toast.error('Failed to save deadline');
        }
    };

    const handleDeleteDeadline = async (id) => {
        if (!window.confirm('Delete this deadline?')) return;
        try {
            await deadlineService.deleteDeadline(id);
            setDeadlines(prev => prev.filter(d => d._id !== id));
            toast.success('Deadline deleted');
        } catch {
            toast.error('Failed to delete deadline');
        }
    };

    const handleStatusToggle = async (deadline) => {
        const newStatus = deadline.status === 'completed' ? 'pending' : 'completed';
        try {
            const data = await deadlineService.updateDeadline(deadline._id, { ...deadline, status: newStatus });
            setDeadlines(prev => prev.map(d => d._id === deadline._id ? data : d));
            toast.success(`Marked as ${newStatus}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pb-16">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-down">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            📅 <span className="gradient-text">Calendar</span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Visualize your deadlines across the month
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingDeadline(null); setIsModalOpen(true); }}
                        className="btn-primary shadow-lg shadow-indigo-300/30 dark:shadow-indigo-700/20"
                    >
                        + Add Deadline
                    </button>
                </div>

                {/* Month Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6 animate-fade-in-up">
                    {[
                        { label: 'This Month', value: monthStats.total, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                        { label: 'Pending', value: monthStats.pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                        { label: 'Done', value: monthStats.completed, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Overdue', value: monthStats.overdue, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                    ].map(s => (
                        <div key={s.label} className={`rounded-xl p-3 ${s.bg} border border-white/60 dark:border-gray-700/30 text-center`}>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ─── Calendar Grid ─── */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden animate-fade-in-up">

                        {/* Month Navigation */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700/60">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all"
                            >
                                <FaChevronLeft size={14} />
                            </button>
                            <div className="text-center">
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                    {format(currentMonth, 'MMMM yyyy')}
                                </h2>
                                <button
                                    onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
                                    className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium mt-0.5"
                                >
                                    Today
                                </button>
                            </div>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all"
                            >
                                <FaChevronRight size={14} />
                            </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700/60">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-2.5 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                const key = format(day, 'yyyy-MM-dd');
                                const dayDeadlines = deadlinesByDate[key] || [];
                                const inMonth = isSameMonth(day, currentMonth);
                                const today = isToday(day);
                                const selected = selectedDate && isSameDay(day, selectedDate);

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            relative min-h-[80px] p-1.5 border-b border-r border-gray-50 dark:border-gray-700/40
                                            transition-all duration-150 text-left group
                                            ${!inMonth ? 'opacity-30' : 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5'}
                                            ${selected ? 'bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500' : ''}
                                        `}
                                    >
                                        {/* Day Number */}
                                        <span className={`
                                            inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold
                                            ${today
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : selected
                                                    ? 'text-indigo-600 dark:text-indigo-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                            }
                                        `}>
                                            {format(day, 'd')}
                                        </span>

                                        {/* Deadline Dots/Pills */}
                                        <div className="mt-0.5 space-y-0.5">
                                            {dayDeadlines.slice(0, 3).map(dl => {
                                                const cat = CATEGORY_COLORS[dl.category] || CATEGORY_COLORS.custom;
                                                return (
                                                    <div
                                                        key={dl._id}
                                                        className={`
                                                            flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate
                                                            ${dl.status === 'completed'
                                                                ? 'bg-gray-100 dark:bg-gray-700/40 text-gray-400 dark:text-gray-500 line-through'
                                                                : cat.light
                                                            }
                                                        `}
                                                        title={dl.title}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dl.status === 'completed' ? 'bg-gray-400' : cat.dot}`} />
                                                        <span className="truncate">{dl.title}</span>
                                                    </div>
                                                );
                                            })}
                                            {dayDeadlines.length > 3 && (
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium pl-1">
                                                    +{dayDeadlines.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ─── Selected Date Panel ─── */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden animate-fade-in-up">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <FaCalendarAlt size={14} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                                        {selectedDate
                                            ? format(selectedDate, 'EEEE, MMM d')
                                            : 'Select a date'
                                        }
                                    </h3>
                                    {selectedDate && (
                                        <p className="text-xs text-gray-400">
                                            {selectedDateDeadlines.length} deadline{selectedDateDeadlines.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
                            {!selectedDate ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <FaCalendarAlt className="text-gray-200 dark:text-gray-700 mb-3" size={32} />
                                    <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                                        Click a date to view deadlines
                                    </p>
                                </div>
                            ) : selectedDateDeadlines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <FaCheck className="text-emerald-300 dark:text-emerald-700 mb-3" size={28} />
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nothing due!</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This day is clear</p>
                                    <button
                                        onClick={() => { setEditingDeadline(null); setIsModalOpen(true); }}
                                        className="mt-3 text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
                                    >
                                        + Add deadline for this day
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDateDeadlines.map(dl => {
                                        const cat = CATEGORY_COLORS[dl.category] || CATEGORY_COLORS.custom;
                                        const isCompleted = dl.status === 'completed';
                                        const daysLeft = differenceInDays(new Date(dl.deadlineDate), new Date());
                                        const isOverdue = daysLeft < 0 && !isCompleted;

                                        return (
                                            <div
                                                key={dl._id}
                                                className={`
                                                    relative p-3.5 rounded-xl border transition-all
                                                    ${isCompleted
                                                        ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/40 opacity-70'
                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 hover:shadow-md'
                                                    }
                                                `}
                                            >
                                                {/* Priority bar */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${dl.priority === 'high' ? 'bg-red-500' :
                                                        dl.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
                                                    } ${isCompleted ? 'opacity-30' : ''}`} />

                                                <div className="pl-2">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h4 className={`text-sm font-semibold ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'
                                                            }`}>
                                                            {dl.title}
                                                        </h4>
                                                        {isOverdue && (
                                                            <FaExclamationTriangle className="text-red-500 shrink-0 mt-0.5" size={12} />
                                                        )}
                                                    </div>

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cat.light}`}>
                                                            {dl.category}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${PRIORITY_BADGE[dl.priority]}`}>
                                                            {dl.priority}
                                                        </span>
                                                        {isOverdue && (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                                                overdue
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleStatusToggle(dl)}
                                                            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${isCompleted
                                                                    ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100'
                                                                    : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            {isCompleted ? <><FaClock size={9} /> Reopen</> : <><FaCheck size={9} /> Done</>}
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingDeadline(dl); setIsModalOpen(true); }}
                                                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDeadline(dl._id)}
                                                            className="px-2.5 py-1 text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <AddDeadlineModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveDeadline}
                    initialData={editingDeadline}
                />
            </div>
        </div>
    );
};

export default Calendar;
