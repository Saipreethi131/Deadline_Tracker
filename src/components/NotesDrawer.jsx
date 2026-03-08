import { useState, useEffect, useCallback, useRef } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
    FaTimes, FaCheck, FaClock, FaTag,
    FaSave, FaTrash,
} from 'react-icons/fa';
import deadlineService from '../services/deadlineService';

const PRIORITY_STYLES = {
    high: { badge: 'badge-high', dot: 'bg-red-500' },
    medium: { badge: 'badge-medium', dot: 'bg-amber-400' },
    low: { badge: 'badge-low', dot: 'bg-emerald-500' },
};

const STATUS_MAP = {
    completed: { label: 'Completed', cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400' },
    pending: { label: 'Pending', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' },
    missed: { label: 'Missed', cls: 'text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400' },
};

const NotesDrawer = ({ deadline, currentUser, onClose, onEdit, onDelete, onNotesSaved }) => {
    const [notes, setNotes] = useState('');
    const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
    const debounceRef = useRef(null);
    const textareaRef = useRef(null);

    // Populate notes when deadline changes
    useEffect(() => {
        if (deadline) {
            setNotes(deadline.notes || '');
            setSaveState('idle');
            // Focus textarea after animation settles
            setTimeout(() => textareaRef.current?.focus(), 300);
        }
    }, [deadline?._id]);

    // Auto-save with 1.5s debounce
    const autoSave = useCallback((value) => {
        clearTimeout(debounceRef.current);
        setSaveState('saving');
        debounceRef.current = setTimeout(async () => {
            try {
                await deadlineService.updateNotes(deadline._id, value);
                setSaveState('saved');
                onNotesSaved?.(deadline._id, value); // ← sync parent state
                setTimeout(() => setSaveState('idle'), 2500);
            } catch {
                setSaveState('error');
            }
        }, 1500);
    }, [deadline?._id]);

    const handleNotesChange = (e) => {
        const val = e.target.value;
        setNotes(val);
        autoSave(val);
    };

    // Cleanup debounce on unmount
    useEffect(() => () => clearTimeout(debounceRef.current), []);

    if (!deadline) return null;

    const daysLeft = differenceInDays(new Date(deadline.deadlineDate), new Date());
    const priority = PRIORITY_STYLES[deadline.priority] || PRIORITY_STYLES.medium;
    const status = STATUS_MAP[deadline.status] || STATUS_MAP.pending;
    const isCompleted = deadline.status === 'completed';

    const urgencyText =
        isCompleted ? '✓ Completed' :
            daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` :
                daysLeft === 0 ? 'Due today!' :
                    `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;

    const urgencyColor =
        isCompleted ? 'text-emerald-500' :
            daysLeft < 0 ? 'text-red-500' :
                daysLeft <= 3 ? 'text-orange-500' :
                    'text-indigo-500';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-gray-950/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col
                            bg-white dark:bg-gray-900
                            border-l border-gray-200 dark:border-gray-700/60
                            shadow-2xl animate-slide-in-right">

                {/* ── Header ── */}
                <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${priority.dot}`} />
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priority.badge}`}>
                                    {deadline.priority.toUpperCase()}
                                </span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.cls}`}>
                                    {status.label}
                                </span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                {deadline.title}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-all"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <FaClock size={11} />
                            <span>{format(new Date(deadline.deadlineDate), 'MMM dd, yyyy')}</span>
                        </div>
                        <span className={`font-bold ${urgencyColor}`}>{urgencyText}</span>
                        <div className="flex items-center gap-1.5">
                            <FaTag size={10} />
                            <span className="capitalize">{deadline.category}</span>
                        </div>
                    </div>

                    {/* Description (if any) */}
                    {deadline.description && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/40">
                            {deadline.description}
                        </p>
                    )}
                </div>

                {/* ── Sub-tasks Checklist ── */}
                {deadline.subtasks && deadline.subtasks.length > 0 && (
                    <div className="flex-shrink-0 px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-700/60">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2.5 flex items-center gap-2">
                            📋 Sub-tasks
                            <span className="text-xs font-normal text-gray-400">
                                {deadline.subtasks.filter(s => s.completed).length}/{deadline.subtasks.length}
                            </span>
                        </h3>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {deadline.subtasks.map((st) => (
                                <button
                                    key={st._id}
                                    onClick={async () => {
                                        try {
                                            const updated = await deadlineService.toggleSubtask(deadline._id, st._id);
                                            onNotesSaved?.(deadline._id, updated.notes, updated);
                                        } catch { }
                                    }}
                                    className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                                        ${st.completed
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-gray-400 dark:text-gray-500 line-through'
                                            : 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}
                                >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                                        ${st.completed
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-gray-300 dark:border-gray-600'}`}>
                                        {st.completed && <FaCheck size={8} />}
                                    </div>
                                    {st.title}
                                </button>
                            ))}
                        </div>
                        {/* Progress bar */}
                        {(() => {
                            const pct = Math.round((deadline.subtasks.filter(s => s.completed).length / deadline.subtasks.length) * 100);
                            return (
                                <div className="mt-2 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${pct}%` }}></div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* ── Collaborators ── */}
                {(() => {
                    const currentUserId = currentUser?._id || currentUser?.id;
                    const displayCollaborators = deadline.collaborators?.filter(
                        c => {
                            const uId = c.user?._id || c.user?.id || c.user;
                            return uId !== currentUserId;
                        }
                    );

                    if (!displayCollaborators || displayCollaborators.length === 0) return null;

                    return (
                        <div className="flex-shrink-0 px-5 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/60">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                                🤝 Collaborators
                            </h3>
                            <div className="space-y-1.5">
                                {displayCollaborators.map((c, i) => {
                                    const displayName = c.user?.name || (c.user?.email ? c.user.email.split('@')[0] : 'User');
                                    const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

                                    return (
                                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-sm">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
                                                {initials}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-gray-700 dark:text-gray-300 font-medium capitalize">{displayName}</span>
                                                {c.user?.email && <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-xs">{c.user.email}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* ── Notes Area ── */}
                <div className="flex-1 flex flex-col overflow-hidden px-5 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            📝 Notes
                        </h3>
                        {/* Save indicator */}
                        <div className="text-xs font-medium flex items-center gap-1.5">
                            {saveState === 'saving' && (
                                <span className="text-amber-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    Saving…
                                </span>
                            )}
                            {saveState === 'saved' && (
                                <span className="text-emerald-500 flex items-center gap-1">
                                    <FaCheck size={10} /> Saved
                                </span>
                            )}
                            {saveState === 'error' && (
                                <span className="text-red-500">Save failed</span>
                            )}
                            {saveState === 'idle' && notes && (
                                <span className="text-gray-400 flex items-center gap-1">
                                    <FaSave size={10} /> Auto-saves
                                </span>
                            )}
                        </div>
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={notes}
                        onChange={handleNotesChange}
                        placeholder="Write anything here…&#10;&#10;• Interview tips&#10;• Links to job posting&#10;• Contacts to follow up with&#10;• Checklist items&#10;• Any other notes"
                        className="flex-1 w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700/60
                                   bg-amber-50/30 dark:bg-gray-800/60
                                   text-gray-800 dark:text-gray-100
                                   placeholder-gray-300 dark:placeholder-gray-600
                                   text-sm leading-relaxed px-4 py-4
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400
                                   transition-all duration-200 font-mono"
                        spellCheck
                    />

                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1.5 text-right">
                        {notes.length} chars · auto-saves as you type
                    </p>
                </div>

                {/* ── Footer Actions ── */}
                <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-700/60 flex justify-between items-center gap-3">
                    <button
                        onClick={() => { onDelete(deadline._id); onClose(); }}
                        className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all"
                    >
                        <FaTrash size={12} /> Delete
                    </button>
                    <button
                        onClick={async () => {
                            // Cancel pending debounce and save immediately
                            clearTimeout(debounceRef.current);
                            if (notes !== (deadline.notes || '')) {
                                try {
                                    await deadlineService.updateNotes(deadline._id, notes);
                                    onNotesSaved?.(deadline._id, notes);
                                } catch { /* ignore — already saved via debounce */ }
                            }
                            onClose();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                                   bg-emerald-500 hover:bg-emerald-600 active:scale-95
                                   text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30
                                   transition-all duration-200"
                    >
                        <FaCheck size={13} /> Done
                    </button>
                </div>
            </div>
        </>
    );
};

export default NotesDrawer;
