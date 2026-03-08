import { differenceInDays, format } from 'date-fns';
import { FaEdit, FaTrash, FaCheck, FaExclamationTriangle, FaCalendarAlt, FaClock, FaStickyNote, FaBell } from 'react-icons/fa';

const PRIORITY_STYLES = {
    high: { badge: 'badge-high', bar: 'bg-red-500' },
    medium: { badge: 'badge-medium', bar: 'bg-amber-400' },
    low: { badge: 'badge-low', bar: 'bg-emerald-500' },
};

const DeadlineCard = ({ deadline, currentUser, onEdit, onDelete, onStatusChange, onCardClick, onAcceptInvite, onRejectInvite }) => {
    const daysLeft = differenceInDays(new Date(deadline.deadlineDate), new Date());
    const isMissed = daysLeft < 0 && deadline.status !== 'completed';
    const isPending = deadline.status === 'pending';
    const isCompleted = deadline.status === 'completed';

    const currentUserId = currentUser?.id || currentUser?._id;
    const isOwner = deadline.user === currentUserId;
    const isPendingInvite = deadline.collaborators?.some(
        c => c.user?._id === currentUserId && c.status === 'pending'
    );

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
        <div
            className={`
                relative group rounded-2xl border transition-all duration-300 overflow-hidden
                hover:shadow-lg hover:-translate-y-0.5 cursor-pointer
                ${isCompleted
                    ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/40 opacity-70'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/60 shadow-sm'}
            `}
            onClick={() => !isPendingInvite && onCardClick?.(deadline)}
            title={isPendingInvite ? "Accept invitation to view notes" : "Click to open notes"}
        >
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

                {/* Reminder indicator */}
                {deadline.reminderEnabled && (
                    <div className="flex items-center gap-1.5 mb-3 text-xs text-indigo-500 dark:text-indigo-400">
                        <FaBell size={10} />
                        <span className="font-medium">Email reminders on</span>
                    </div>
                )}

                {/* Sub-task progress */}
                {deadline.subtasks && deadline.subtasks.length > 0 && (() => {
                    const total = deadline.subtasks.length;
                    const done = deadline.subtasks.filter(st => st.completed).length;
                    const pct = Math.round((done / total) * 100);
                    return (
                        <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500 dark:text-gray-400 font-medium">Sub-tasks</span>
                                <span className={`font-bold ${pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{done}/{total}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${pct}%` }}></div>
                            </div>
                        </div>
                    );
                })()}

                {/* Collaborator avatars */}
                {deadline.collaborators && deadline.collaborators.length > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                        {(() => {
                            const currentUserId = currentUser?._id || currentUser?.id;
                            let displayUsers = [];

                            if (isOwner) {
                                // Owner sees all collaborators
                                displayUsers = deadline.collaborators.map(c => c.user);
                            } else {
                                // Collaborator sees the Owner + other collaborators
                                if (deadline.user) displayUsers.push(deadline.user);
                                displayUsers = displayUsers.concat(
                                    deadline.collaborators
                                        .filter(c => {
                                            const cId = c.user?._id || c.user?.id || c.user;
                                            return cId !== currentUserId;
                                        })
                                        .map(c => c.user)
                                );
                            }

                            return (
                                <>
                                    {displayUsers.slice(0, 4).map((u, i) => {
                                        const name = u?.name || (u?.email ? u.email.split('@')[0] : 'User');
                                        const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                                        return (
                                            <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold border-2 border-white dark:border-gray-800 -ml-1 first:ml-0"
                                                title={u?.name || u?.email || 'User'}>
                                                {initials}
                                            </div>
                                        );
                                    })}
                                    {displayUsers.length > 4 && (
                                        <span className="text-[10px] text-gray-400 ml-1 font-medium">+{displayUsers.length - 4}</span>
                                    )}
                                    <span className="text-[10px] text-gray-400 ml-1.5">shared</span>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    {isPendingInvite ? (
                        <>
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-1">
                                Shared by <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {deadline.user?.name || (deadline.user?.email ? deadline.user.email.split('@')[0] : 'a user')}
                                </span>
                            </div>
                            <div className="flex w-full gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAcceptInvite(deadline._id); }}
                                    className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-500/20"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRejectInvite(deadline._id); }}
                                    className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all"
                                >
                                    Decline
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex gap-1">
                                {isOwner && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEdit(deadline); }}
                                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 transition-all"
                                            title="Edit"
                                        >
                                            <FaEdit size={13} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(deadline._id); }}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all"
                                            title="Delete"
                                        >
                                            <FaTrash size={13} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {!isCompleted && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onStatusChange(deadline._id, 'completed'); }}
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
                        </>
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
