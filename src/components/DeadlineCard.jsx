import { differenceInDays, format } from 'date-fns';
import { FaEdit, FaTrash, FaCheck, FaExclamationTriangle, FaCalendarAlt, FaClock } from 'react-icons/fa';

const PRIORITY_STYLES = {
    high: { badge: 'badge-high', bar: 'bg-red-500' },
    medium: { badge: 'badge-medium', bar: 'bg-amber-400' },
    low: { badge: 'badge-low', bar: 'bg-emerald-500' },
};

const DeadlineCard = ({ deadline, onEdit, onDelete, onStatusChange }) => {
    const daysLeft = differenceInDays(new Date(deadline.deadlineDate), new Date());
    const isMissed = daysLeft < 0 && deadline.status !== 'completed';
    const isPending = deadline.status === 'pending';
    const isCompleted = deadline.status === 'completed';

    const priority = PRIORITY_STYLES[deadline.priority] || PRIORITY_STYLES.medium;

    const urgencyColor =
        isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
            daysLeft < 0 ? 'text-red-500 dark:text-red-400' :
                daysLeft <= 3 ? 'text-orange-500 dark:text-orange-400' :
                    daysLeft <= 7 ? 'text-amber-500 dark:text-amber-400' :
                        'text-indigo-500 dark:text-indigo-400';

    const urgencyLabel =
        isCompleted ? '✓ Done' :
            daysLeft < 0 ? 'Overdue' :
                daysLeft === 0 ? 'Due today!' :
                    `${daysLeft}d left`;

    return (
        <div className={`
            relative group rounded-2xl border transition-all duration-300 overflow-hidden
            hover:shadow-lg hover:-translate-y-0.5
            ${isCompleted
                ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/40 opacity-70'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 shadow-sm'}
        `}>
            {/* Priority bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${priority.bar} ${isCompleted ? 'opacity-30' : ''}`}></div>

            <div className="p-4 pl-5">
                {/* Top row */}
                <div className="flex justify-between items-start gap-2 mb-2.5">
                    <h3 className={`text-sm font-semibold leading-snug flex-1 ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                        }`}>
                        {deadline.title}
                    </h3>
                    <span className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded-full ${priority.badge}`}>
                        {deadline.priority.toUpperCase()}
                    </span>
                </div>

                {/* Description */}
                {deadline.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                        {deadline.description}
                    </p>
                )}

                {/* Date + Urgency */}
                <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <FaCalendarAlt size={11} className="text-gray-400" />
                        <span>{format(new Date(deadline.deadlineDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${urgencyColor}`}>
                        <FaClock size={11} />
                        <span>{urgencyLabel}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="flex gap-1">
                        <button
                            onClick={() => onEdit(deadline)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all"
                            title="Edit"
                        >
                            <FaEdit size={13} />
                        </button>
                        <button
                            onClick={() => onDelete(deadline._id)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
                            title="Delete"
                        >
                            <FaTrash size={13} />
                        </button>
                    </div>

                    {isPending && (
                        <button
                            onClick={() => onStatusChange(deadline._id, 'completed')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-xs font-semibold"
                        >
                            <FaCheck size={10} /> Mark Done
                        </button>
                    )}
                    {isCompleted && (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <FaCheck size={10} /> Completed
                        </span>
                    )}
                </div>
            </div>

            {/* Missed indicator */}
            {isMissed && (
                <div className="absolute top-2 right-2 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-full p-1.5 shadow-sm">
                    <FaExclamationTriangle size={10} />
                </div>
            )}
        </div>
    );
};

export default DeadlineCard;
