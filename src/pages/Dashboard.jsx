import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaFilter, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import deadlineService from '../services/deadlineService';
import DeadlineColumn from '../components/DeadlineColumn';
import AddDeadlineModal from '../components/AddDeadlineModal';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['assignment', 'internship', 'job', 'hackathon', 'custom'];
const COLUMN_LABELS = ['Assignments', 'Internships', 'Jobs', 'Hackathons', 'Custom'];

const Dashboard = () => {
    const { user } = useAuth();
    const [deadlines, setDeadlines] = useState([]);
    const [filteredDeadlines, setFilteredDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDeadline, setCurrentDeadline] = useState(null);

    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchDeadlines(); }, []);

    useEffect(() => {
        applyFiltersAndSort();
    }, [deadlines, filterCategory, filterPriority, filterStatus, sortBy, searchTerm]);

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

    const handleSaveDeadline = async (formData) => {
        try {
            if (currentDeadline) {
                const data = await deadlineService.updateDeadline(currentDeadline._id, formData);
                setDeadlines(prev => prev.map(d => d._id === currentDeadline._id ? data : d));
                toast.success('Deadline updated');
            } else {
                const data = await deadlineService.createDeadline(formData);
                setDeadlines(prev => [...prev, data]);
                toast.success('Deadline created');
            }
        } catch (error) {
            toast.error('Failed to save deadline');
            console.error(error);
        }
    };

    const applyFiltersAndSort = () => {
        let result = [...deadlines];

        if (searchTerm) {
            result = result.filter(d =>
                d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (filterCategory !== 'all') result = result.filter(d => d.category === filterCategory);
        if (filterPriority !== 'all') result = result.filter(d => d.priority === filterPriority);
        if (filterStatus !== 'all') result = result.filter(d => d.status === filterStatus);

        result.sort((a, b) => {
            if (sortBy === 'date') return new Date(a.deadlineDate) - new Date(b.deadlineDate);
            if (sortBy === 'priority') return ({ high: 3, medium: 2, low: 1 }[b.priority] || 0) - ({ high: 3, medium: 2, low: 1 }[a.priority] || 0);
            return 0;
        });

        setFilteredDeadlines(result);
    };

    const getByCategory = (cat) => filteredDeadlines.filter(d => d.category === cat);

    const hasActiveFilters = filterCategory !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' || searchTerm;

    const clearFilters = () => {
        setFilterCategory('all');
        setFilterPriority('all');
        setFilterStatus('all');
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

    if (loading) return <Loader />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pb-12">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-down">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Hey, <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span> 👋
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's your deadline overview.</p>
                    </div>
                    <button
                        id="add-deadline-btn"
                        onClick={handleAddClick}
                        className="btn-primary shadow-lg shadow-indigo-300/30 dark:shadow-indigo-700/20"
                    >
                        <FaPlus size={13} /> Add Deadline
                    </button>
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

                {/* Filters Bar */}
                <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 mb-6 shadow-sm">
                    <div className="flex flex-wrap gap-3 items-center">

                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px]">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                            <input
                                type="text"
                                placeholder="Search deadlines..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pl-8 pr-4 py-2 text-sm"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="form-input pl-9 pr-3 py-2 text-sm appearance-none cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="assignment">Assignment</option>
                                <option value="internship">Internship</option>
                                <option value="job">Job</option>
                                <option value="hackathon">Hackathon</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="form-input px-3 py-2 text-sm appearance-none cursor-pointer"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">🔴 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">🟢 Low</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="form-input px-3 py-2 text-sm appearance-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                        </select>

                        {/* Sort */}
                        <div className="relative">
                            <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={10} />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="form-input pl-9 pr-3 py-2 text-sm appearance-none cursor-pointer"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="priority">Sort by Priority</option>
                            </select>
                        </div>

                        {/* Clear filters */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            >
                                <FaTimes size={10} /> Clear
                            </button>
                        )}
                    </div>

                    {/* Active filter count */}
                    {hasActiveFilters && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2.5 pl-1">
                            Showing <strong className="text-gray-600 dark:text-gray-300">{filteredDeadlines.length}</strong> of <strong className="text-gray-600 dark:text-gray-300">{total}</strong> deadlines
                        </p>
                    )}
                </div>

                {/* Kanban Columns */}
                <div className="flex overflow-x-auto pb-6 gap-5 snap-x snap-mandatory">
                    {CATEGORIES.map((cat, i) => (
                        <DeadlineColumn
                            key={cat}
                            title={COLUMN_LABELS[i]}
                            deadlines={getByCategory(cat)}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteClick}
                            onStatusChange={handleStatusChange}
                        />
                    ))}
                </div>

                <AddDeadlineModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveDeadline}
                    initialData={currentDeadline}
                />
            </div>
        </div>
    );
};

export default Dashboard;
