import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { format, differenceInDays } from 'date-fns';
import {
    FaClock, FaCheck, FaExclamationTriangle, FaPlus,
    FaCalendarAlt, FaGripVertical, FaFlag,
} from 'react-icons/fa';
import deadlineService from '../services/deadlineService';
import AddDeadlineModal from '../components/AddDeadlineModal';
import Loader from '../components/Loader';

const COLUMNS = [
    {
        key: 'pending',
        label: 'Pending',
        emoji: '⏳',
        gradient: 'from-amber-400 to-orange-500',
        bg: 'bg-amber-50/80 dark:bg-amber-500/5',
        border: 'border-amber-200/60 dark:border-amber-500/20',
        dot: 'bg-amber-500',
    },
    {
        key: 'in-progress',
        label: 'In Progress',
        emoji: '🔄',
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-50/80 dark:bg-blue-500/5',
        border: 'border-blue-200/60 dark:border-blue-500/20',
        dot: 'bg-blue-500',
    },
    {
        key: 'completed',
        label: 'Completed',
        emoji: '✅',
        gradient: 'from-emerald-400 to-teal-500',
        bg: 'bg-emerald-50/80 dark:bg-emerald-500/5',
        border: 'border-emerald-200/60 dark:border-emerald-500/20',
        dot: 'bg-emerald-500',
    },
];

const PRIORITY_BAR = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-500' };
const PRIORITY_BADGE = {
    high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
};
const CATEGORY_BADGE = {
    assignment: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    internship: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    job: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    hackathon: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    custom: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300',
};

const Kanban = () => {
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDeadline, setEditingDeadline] = useState(null);
    const [draggedId, setDraggedId] = useState(null);
    const [dragOverCol, setDragOverCol] = useState(null);

    useEffect(() => { fetchDeadlines(); }, []);

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

    // Map backend statuses to kanban columns
    // 'pending' deadlines without 'missed' go to pending or in-progress
    // We use a custom field approach: if status is 'pending', check a tag
    // Simple approach: treat 'pending' as pending, 'missed' as pending (overdue), 'completed' as completed
    // Add "in-progress" as a pseudo-status stored in notes or a separate field
    // For simplicity, we'll use the existing status + treat "missed" deadlines as pending (overdue)

    const getColumnItems = (columnKey) => {
        return deadlines.filter(d => {
            if (columnKey === 'completed') return d.status === 'completed';
            if (columnKey === 'in-progress') return d.status === 'in-progress';
            // Pending column: pending + missed
            return d.status === 'pending' || d.status === 'missed';
        }).sort((a, b) => {
            const prio = { high: 3, medium: 2, low: 1 };
            return (prio[b.priority] || 0) - (prio[a.priority] || 0);
        });
    };

    const handleDragStart = (e, id) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Make the drag image slightly transparent
        setTimeout(() => {
            const el = document.getElementById(`kanban-card-${id}`);
            if (el) el.style.opacity = '0.4';
        }, 0);
    };

    const handleDragEnd = (e) => {
        const el = document.getElementById(`kanban-card-${draggedId}`);
        if (el) el.style.opacity = '1';
        setDraggedId(null);
        setDragOverCol(null);
    };

    const handleDragOver = (e, columnKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCol(columnKey);
    };

    const handleDragLeave = () => {
        setDragOverCol(null);
    };

    const handleDrop = async (e, columnKey) => {
        e.preventDefault();
        setDragOverCol(null);

        if (!draggedId) return;

        const deadline = deadlines.find(d => d._id === draggedId);
        if (!deadline) return;

        // Map column key to status
        let newStatus = columnKey;
        if (columnKey === 'in-progress') newStatus = 'in-progress';

        // Don't update if same column
        const currentCol = deadline.status === 'completed' ? 'completed' :
            deadline.status === 'in-progress' ? 'in-progress' : 'pending';
        if (currentCol === columnKey) return;

        try {
            const data = await deadlineService.updateDeadline(deadline._id, {
                ...deadline,
                status: newStatus,
            });
            setDeadlines(prev => prev.map(d => d._id === deadline._id ? data : d));
            toast.success(`Moved to ${COLUMNS.find(c => c.key === columnKey)?.label}`);
        } catch {
            toast.error('Failed to move deadline');
        }
    };

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

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this deadline?')) return;
        try {
            await deadlineService.deleteDeadline(id);
            setDeadlines(prev => prev.filter(d => d._id !== id));
            toast.success('Deadline deleted');
        } catch {
            toast.error('Failed to delete');
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
                            🏷️ <span className="gradient-text">Kanban Board</span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Drag and drop deadlines to update their status
                        </p>
                    </div>
                    <button
                        onClick={() => { setEditingDeadline(null); setIsModalOpen(true); }}
                        className="btn-primary shadow-lg shadow-indigo-300/30 dark:shadow-indigo-700/20"
                    >
                        <FaPlus size={13} /> Add Deadline
                    </button>
                </div>

                {/* Kanban Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in-up">
                    {COLUMNS.map(col => {
                        const items = getColumnItems(col.key);
                        const isOver = dragOverCol === col.key;

                        return (
                            <div
                                key={col.key}
                                className={`
                                    rounded-2xl border-2 transition-all duration-200
                                    ${isOver
                                        ? `${col.border} border-dashed shadow-lg scale-[1.01]`
                                        : 'border-gray-100 dark:border-gray-700/60'
                                    }
                                `}
                                onDragOver={(e) => handleDragOver(e, col.key)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.key)}
                            >
                                {/* Column Header */}
                                <div className={`px-4 py-3.5 rounded-t-2xl ${col.bg} border-b ${col.border}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                                {col.emoji} {col.label}
                                            </h2>
                                        </div>
                                        <span className={`
                                            px-2.5 py-0.5 text-xs font-bold rounded-full
                                            bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300
                                            border border-gray-200 dark:border-gray-700
                                        `}>
                                            {items.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Cards Container */}
                                <div
                                    className={`p-3 space-y-3 min-h-[200px] transition-colors duration-200 rounded-b-2xl ${isOver ? col.bg : 'bg-gray-50/50 dark:bg-gray-900/30'
                                        }`}
                                >
                                    {items.length > 0 ? items.map(dl => {
                                        const daysLeft = differenceInDays(new Date(dl.deadlineDate), new Date());
                                        const isOverdue = daysLeft < 0 && dl.status !== 'completed';
                                        const isCompleted = dl.status === 'completed';

                                        return (
                                            <div
                                                key={dl._id}
                                                id={`kanban-card-${dl._id}`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, dl._id)}
                                                onDragEnd={handleDragEnd}
                                                className={`
                                                    relative group bg-white dark:bg-gray-800 rounded-xl border
                                                    border-gray-100 dark:border-gray-700/60 shadow-sm
                                                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
                                                    cursor-grab active:cursor-grabbing
                                                    ${isCompleted ? 'opacity-70' : ''}
                                                `}
                                            >
                                                {/* Priority bar */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${PRIORITY_BAR[dl.priority] || PRIORITY_BAR.medium} ${isCompleted ? 'opacity-30' : ''}`} />

                                                <div className="p-3.5 pl-4">
                                                    {/* Drag handle + Title */}
                                                    <div className="flex items-start gap-2 mb-2">
                                                        <FaGripVertical className="text-gray-300 dark:text-gray-600 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" size={11} />
                                                        <h4 className={`text-sm font-semibold leading-snug flex-1 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'
                                                            }`}>
                                                            {dl.title}
                                                        </h4>
                                                        {isOverdue && (
                                                            <FaExclamationTriangle className="text-red-500 shrink-0 mt-0.5" size={11} />
                                                        )}
                                                    </div>

                                                    {/* Description preview */}
                                                    {dl.description && (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 line-clamp-2 pl-5">
                                                            {dl.description}
                                                        </p>
                                                    )}

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1.5 mb-2.5 pl-5">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${CATEGORY_BADGE[dl.category] || CATEGORY_BADGE.custom}`}>
                                                            {dl.category}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${PRIORITY_BADGE[dl.priority]}`}>
                                                            {dl.priority}
                                                        </span>
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="flex items-center justify-between pl-5">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                            <FaCalendarAlt size={10} />
                                                            <span>{format(new Date(dl.deadlineDate), 'MMM dd')}</span>
                                                        </div>
                                                        <div className={`text-[11px] font-bold ${isCompleted ? 'text-emerald-500' :
                                                                isOverdue ? 'text-red-500' :
                                                                    daysLeft <= 3 ? 'text-orange-500' :
                                                                        'text-indigo-500 dark:text-indigo-400'
                                                            }`}>
                                                            {isCompleted ? '✓ Done' :
                                                                isOverdue ? `${Math.abs(daysLeft)}d overdue` :
                                                                    daysLeft === 0 ? 'Due today' :
                                                                        `${daysLeft}d left`}
                                                        </div>
                                                    </div>

                                                    {/* Hover actions */}
                                                    <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-700/40 opacity-0 group-hover:opacity-100 transition-opacity pl-5">
                                                        <button
                                                            onClick={() => { setEditingDeadline(dl); setIsModalOpen(true); }}
                                                            className="px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 transition-all"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(dl._id)}
                                                            className="px-2 py-1 text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 transition-all"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${col.gradient} flex items-center justify-center text-lg mb-2 opacity-40`}>
                                                {col.emoji}
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                {col.key === 'pending' ? 'No pending deadlines' :
                                                    col.key === 'in-progress' ? 'Drag items here' :
                                                        'Nothing completed yet'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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

export default Kanban;
