import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import deadlineService from '../services/deadlineService';
import DeadlineCard from '../components/DeadlineCard';
import AddDeadlineModal from '../components/AddDeadlineModal';
import NotesDrawer from '../components/NotesDrawer';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
    { key: 'all', label: 'All', emoji: '📋', gradient: 'from-gray-500 to-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/50', ring: 'ring-gray-300 dark:ring-gray-600' },
    { key: 'assignment', label: 'Assignments', emoji: '📚', gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-blue-300 dark:ring-blue-700' },
    { key: 'internship', label: 'Internships', emoji: '💼', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-900/20', ring: 'ring-violet-300 dark:ring-violet-700' },
    { key: 'job', label: 'Jobs', emoji: '🏢', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-300 dark:ring-emerald-700' },
    { key: 'hackathon', label: 'Hackathons', emoji: '⚡', gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50 dark:bg-orange-900/20', ring: 'ring-orange-300 dark:ring-orange-700' },
    { key: 'custom', label: 'Custom', emoji: '✏️', gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50 dark:bg-pink-900/20', ring: 'ring-pink-300 dark:ring-pink-700' },
    { key: 'shared', label: 'Shared', emoji: '🤝', gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-900/20', ring: 'ring-purple-300 dark:ring-purple-700' },
    { key: 'completed', label: 'Completed', emoji: '✅', gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-100 dark:bg-gray-800/50', ring: 'ring-gray-300 dark:ring-gray-700' },
];

const Dashboard = () => {
    const { user } = useAuth();
    const [deadlines, setDeadlines] = useState([]);
    const [filteredDeadlines, setFilteredDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDeadline, setCurrentDeadline] = useState(null);

    const [activeTab, setActiveTab] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDeadline, setSelectedDeadline] = useState(null);


    useEffect(() => { fetchDeadlines(); }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [deadlines, activeTab, searchTerm]);

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



    const handleAddClick = () => { setCurrentDeadline(null); setIsModalOpen(true); };
    const handleEditClick = (d) => { setCurrentDeadline(d); setIsModalOpen(true); };

    const handleDeleteClick = async (id) => {
        if (!window.confirm('Delete this deadline?')) return;
        try {
            await deadlineService.deleteDeadline(id);
            setDeadlines(prev => prev.filter(d => d._id !== id));
            toast.success('Deadline deleted');
        } catch {
            toast.error('Failed to delete deadline');
        }
    };

    // Called by NotesDrawer after every successful auto-save or subtask toggle
    const handleNotesSaved = (id, notes, updatedDeadline) => {
        if (updatedDeadline) {
            // Full deadline update (from subtask toggle)
            setDeadlines(prev =>
                prev.map(d => d._id === id ? updatedDeadline : d)
            );
            setSelectedDeadline(prev =>
                prev?._id === id ? updatedDeadline : prev
            );
        } else {
            // Notes-only update
            setDeadlines(prev =>
                prev.map(d => d._id === id ? { ...d, notes } : d)
            );
            setSelectedDeadline(prev =>
                prev?._id === id ? { ...prev, notes } : prev
            );
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const deadline = deadlines.find(d => d._id === id);
            const data = await deadlineService.updateDeadline(id, { ...deadline, status });
            setDeadlines(prev => prev.map(d => d._id === id ? data : d));
            toast.success(`Marked as ${status}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleAcceptInvite = async (id) => {
        try {
            const data = await deadlineService.acceptInvite(id);
            setDeadlines(prev => prev.map(d => d._id === id ? data : d));
            toast.success('Invitation accepted');
        } catch {
            toast.error('Failed to accept invitation');
        }
    };

    const handleRejectInvite = async (id) => {
        try {
            await deadlineService.rejectInvite(id);
            setDeadlines(prev => prev.filter(d => d._id !== id));
            toast.success('Invitation rejected');
        } catch {
            toast.error('Failed to reject invitation');
        }
    };

    const handleSaveDeadline = async (formData) => {
        try {
            const { collaboratorEmails, ...deadlineData } = formData;
            if (currentDeadline) {
                // If editing existing, allow updates to details
                const data = await deadlineService.updateDeadline(currentDeadline._id, deadlineData);
                setDeadlines(prev => prev.map(d => d._id === currentDeadline._id ? data : d));
                toast.success('Deadline updated');
            } else {
                // Now passes both deadline data AND collaborator target emails
                const data = await deadlineService.createDeadline({
                    ...deadlineData,
                    collaboratorEmails
                });

                setDeadlines(prev => [...prev, data]);
                toast.success('Deadline created');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save deadline');
            console.error(error);
        }
    };

    const applyFiltersAndSort = () => {
        let result = [...deadlines];

        if (activeTab === 'completed') {
            result = result.filter(d => d.status === 'completed');
        } else {
            result = result.filter(d => d.status !== 'completed'); // Hide from 'All' and other categories
        }

        if (searchTerm) {
            result = result.filter(d =>
                d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (activeTab === 'shared') {
            result = result.filter(d => d.collaborators && d.collaborators.length > 0);
            result = result.filter(d => d.status !== 'completed');
        } else if (activeTab !== 'all' && activeTab !== 'completed') {
            result = result.filter(d => d.category === activeTab);
        }

        // Enforce automatic sorting by date
        result.sort((a, b) => new Date(a.deadlineDate) - new Date(b.deadlineDate));

        setFilteredDeadlines(result);
    };

    const getCategoryCount = (key) => {
        if (key === 'completed') {
            return deadlines.filter(d => d.status === 'completed').length;
        }
        if (key === 'shared') {
            return deadlines.filter(d => d.status !== 'completed' && d.collaborators && d.collaborators.length > 0).length;
        }

        const activeDeadlines = deadlines.filter(d => d.status !== 'completed');

        if (key === 'all') return activeDeadlines.length;
        return activeDeadlines.filter(d => d.category === key).length;
    };

    const hasActiveFilters = searchTerm !== '';

    const clearFilters = () => {
        setSearchTerm('');
    };

    // Stats
    const total = deadlines.length;
    const done = deadlines.filter(d => d.status === 'completed').length;
    const pending = deadlines.filter(d => d.status === 'pending').length;
    const overdue = deadlines.filter(d => {
        const diff = new Date(d.deadlineDate) - new Date();
        return diff < 0 && d.status !== 'completed';
    }).length;

    const activeCat = CATEGORIES.find(c => c.key === activeTab) || CATEGORIES[0];

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pb-12">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-down">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Hey, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's your deadline overview.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 sm:w-64">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                            <input
                                type="text"
                                placeholder="Search deadlines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pl-8 pr-4 py-2 text-sm w-full"
                            />
                        </div>
                        <button
                            id="add-deadline-btn"
                            onClick={handleAddClick}
                            className="btn-primary shadow-lg shadow-indigo-300/30 dark:shadow-indigo-700/20 whitespace-nowrap"
                        >
                            <FaPlus size={13} /> Add Deadline
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
                    {[
                        { label: 'Total', value: total, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Pending', value: pending, color: 'from-amber-400 to-orange-400', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
                        { label: 'Done', value: done, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Overdue', value: overdue, color: 'from-red-500 to-rose-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
                    ].map(stat => (
                        <div key={stat.label} className={`rounded-2xl p-4 ${stat.bg} border border-white/60 dark:border-gray-700/30`}>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.text}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>



                {/* Active search filter count */}
                {hasActiveFilters && (
                    <div className="mb-4">
                        <button
                            onClick={clearFilters}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-red-100 dark:border-red-900/30"
                        >
                            <FaTimes size={10} /> Clear Search
                        </button>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 pl-1">
                            Showing <strong className="text-gray-600 dark:text-gray-300">{filteredDeadlines.length}</strong> results for "{searchTerm}"
                        </p>
                    </div>
                )}

                {/* ─── Category Tabs ─── */}
                <div className="mb-6 animate-fade-in-up">
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => {
                            const count = getCategoryCount(cat.key);
                            const isActive = activeTab === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => setActiveTab(cat.key)}
                                    className={`
                                        group relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold
                                        transition-all duration-300 ease-out
                                        ${isActive
                                            ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg shadow-black/10 scale-[1.02]`
                                            : `${cat.bg} text-gray-600 dark:text-gray-300 hover:scale-[1.02] hover:shadow-md border border-white/60 dark:border-gray-700/40`
                                        }
                                    `}
                                >
                                    <span className="text-base">{cat.emoji}</span>
                                    <span>{cat.label}</span>
                                    <span className={`
                                        px-2 py-0.5 text-xs font-bold rounded-full min-w-[20px] text-center
                                        ${isActive
                                            ? 'bg-white/25 text-white'
                                            : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }
                                    `}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Active Category Header ─── */}
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${activeCat.gradient} flex items-center justify-center text-lg shadow-md`}>
                        {activeCat.emoji}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{activeCat.label}</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {filteredDeadlines.length} deadline{filteredDeadlines.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* ─── Deadline Cards Grid ─── */}
                {filteredDeadlines.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 animate-fade-in-up">
                        {filteredDeadlines.map((deadline) => (
                            <DeadlineCard
                                key={deadline._id}
                                deadline={deadline}
                                currentUser={user}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                                onStatusChange={handleStatusChange}
                                onCardClick={setSelectedDeadline}
                                onAcceptInvite={handleAcceptInvite}
                                onRejectInvite={handleRejectInvite}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${activeCat.gradient} flex items-center justify-center text-3xl mb-4 shadow-lg opacity-50`}>
                            {activeCat.emoji}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-400 dark:text-gray-500 mb-1">
                            No {activeTab === 'all' ? '' : activeCat.label.toLowerCase() + ' '}deadlines
                        </h3>
                        <p className="text-sm text-gray-300 dark:text-gray-600">
                            Click "Add Deadline" to get started
                        </p>
                    </div>
                )}

                <AddDeadlineModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveDeadline}
                    initialData={currentDeadline}
                />
                <NotesDrawer
                    deadline={selectedDeadline}
                    currentUser={user}
                    onClose={() => setSelectedDeadline(null)}
                    onEdit={(d) => { setCurrentDeadline(d); setIsModalOpen(true); }}
                    onDelete={handleDeleteClick}
                    onNotesSaved={handleNotesSaved}
                />
            </div>
        </div>
    );
};

export default Dashboard;
