import DeadlineCard from './DeadlineCard';
import { FaInbox } from 'react-icons/fa';

const COLUMN_COLORS = {
    Assignments: { dot: 'bg-blue-500', count: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    Internships: { dot: 'bg-violet-500', count: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    Jobs: { dot: 'bg-emerald-500', count: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    Hackathons: { dot: 'bg-orange-500', count: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    Custom: { dot: 'bg-pink-500', count: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
};

const DeadlineColumn = ({ title, deadlines, onEdit, onDelete, onStatusChange }) => {
    const colors = COLUMN_COLORS[title] || { dot: 'bg-gray-400', count: 'bg-gray-100 text-gray-600' };

    return (
        <div className="flex-1 min-w-[290px] max-w-sm flex flex-col snap-start">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>
                    <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                        {title}
                    </h2>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${colors.count}`}>
                    {deadlines.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                {deadlines.length > 0 ? (
                    deadlines.map((deadline) => (
                        <DeadlineCard
                            key={deadline._id}
                            deadline={deadline}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center px-4">
                        <FaInbox className="text-gray-300 dark:text-gray-600 mb-2" size={22} />
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">No deadlines yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeadlineColumn;
