import { useState, useEffect } from 'react';
import { FaTimes, FaTag, FaCalendarAlt, FaFlag, FaBell, FaPlus, FaTrash, FaUserPlus } from 'react-icons/fa';

const AddDeadlineModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'assignment',
        customCategoryName: '',
        deadlineDate: '',
        priority: 'medium',
        status: 'pending',
        reminderEnabled: false,
    });
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [collaboratorEmail, setCollaboratorEmail] = useState('');
    const [collaboratorEmails, setCollaboratorEmails] = useState([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                deadlineDate: initialData.deadlineDate
                    ? initialData.deadlineDate.split('T')[0]
                    : '',
            });
            setSubtasks(initialData.subtasks || []);
        } else {
            setFormData({
                title: '', description: '', category: 'assignment',
                customCategoryName: '', deadlineDate: '', priority: 'medium',
                status: 'pending', reminderEnabled: false,
            });
            setSubtasks([]);
            setCollaboratorEmails([]);
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        let finalSubtasks = [...subtasks];
        if (newSubtask.trim()) {
            finalSubtasks.push({ title: newSubtask.trim(), completed: false });
        }

        let finalEmails = [...collaboratorEmails];
        if (collaboratorEmail.trim() && !finalEmails.includes(collaboratorEmail.trim().toLowerCase())) {
            finalEmails.push(collaboratorEmail.trim().toLowerCase());
        }

        // Pass formData, plus subtasks and collaborator emails
        onSave({
            ...formData,
            subtasks: finalSubtasks,
            collaboratorEmails: finalEmails
        });

        onClose();
    };

    const handleAddSubtask = () => {
        if (newSubtask.trim()) {
            setSubtasks([...subtasks, { title: newSubtask.trim(), completed: false }]);
            setNewSubtask('');
        }
    };

    const handleRemoveSubtask = (index) => {
        setSubtasks(subtasks.filter((_, i) => i !== index));
    };

    const handleAddCollaborator = () => {
        const email = collaboratorEmail.trim().toLowerCase();
        if (email && !collaboratorEmails.includes(email)) {
            setCollaboratorEmails([...collaboratorEmails, email]);
            setCollaboratorEmail('');
        }
    };

    const handleRemoveCollaborator = (index) => {
        setCollaboratorEmails(collaboratorEmails.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    const PRIORITY_OPTIONS = [
        { value: 'low', label: '🟢 Low' },
        { value: 'medium', label: '🟡 Medium' },
        { value: 'high', label: '🔴 High' },
    ];

    const CATEGORY_OPTIONS = [
        { value: 'assignment', label: '📚 Assignment' },
        { value: 'internship', label: '💼 Internship' },
        { value: 'job', label: '🏢 Job' },
        { value: 'hackathon', label: '⚡ Hackathon' },
        { value: 'custom', label: '✏️ Custom' },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-950/60 dark:bg-black/70 backdrop-blur-sm"></div>

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg animate-scale-in border border-gray-100 dark:border-gray-700/60 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700/60">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {initialData ? '✏️ Edit Deadline' : '➕ Add New Deadline'}
                        </h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {initialData ? 'Update the details below.' : 'Fill in the details to create a new deadline.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Form wraps everything below header */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Content */}
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="modal-title"
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Submit Research Paper"
                                className="form-input px-3.5"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Optional notes or details..."
                                className="form-input px-3.5 resize-none"
                            />
                        </div>

                        {/* Category + Custom Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <FaTag size={11} /> Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="form-input px-3.5"
                                >
                                    {CATEGORY_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.category === 'custom' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Custom Name</label>
                                    <input
                                        type="text"
                                        name="customCategoryName"
                                        value={formData.customCategoryName}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Freelance"
                                        className="form-input px-3.5"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                        <FaFlag size={11} /> Priority
                                    </label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                        className="form-input px-3.5"
                                    >
                                        {PRIORITY_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Show priority separately if custom category is selected */}
                        {formData.category === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <FaFlag size={11} /> Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className="form-input px-3.5"
                                >
                                    {PRIORITY_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Deadline Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                <FaCalendarAlt size={11} /> Deadline Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="modal-date"
                                type="date"
                                name="deadlineDate"
                                value={formData.deadlineDate}
                                onChange={handleChange}
                                required
                                className="form-input px-3.5"
                            />
                        </div>

                        {/* Reminder Toggle */}
                        <div className={`p-3.5 rounded-xl border transition-colors duration-200 ${formData.reminderEnabled
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30'
                            : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-600/40'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="reminderEnabled"
                                        id="reminderEnabled"
                                        checked={formData.reminderEnabled}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div
                                        onClick={() => setFormData(p => ({ ...p, reminderEnabled: !p.reminderEnabled }))}
                                        className={`w-10 h-5.5 rounded-full cursor-pointer transition-colors duration-200 flex items-center
                                        ${formData.reminderEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                                        style={{ height: '22px' }}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mx-0.5
                                        ${formData.reminderEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                                    <FaBell size={12} />
                                    Email Reminders
                                </div>
                            </div>

                            {/* Schedule info — shown when enabled */}
                            {formData.reminderEnabled && (
                                <div className="mt-2.5 ml-[52px] text-xs text-indigo-600/70 dark:text-indigo-400/70 leading-relaxed">
                                    📬 You'll receive email reminders at <strong>7 days</strong>, <strong>3 days</strong>, <strong>1 day</strong>, and on the <strong>day of</strong> the deadline (8:00 AM IST).
                                </div>
                            )}
                        </div>

                        {/* Sub-tasks Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sub-tasks</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newSubtask}
                                    onChange={(e) => setNewSubtask(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubtask();
                                        }
                                    }}
                                    placeholder="Add a sub-task..."
                                    className="form-input px-3.5 flex-1"
                                />
                                <button type="button" onClick={handleAddSubtask}
                                    className="px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all">
                                    <FaPlus size={12} />
                                </button>
                            </div>
                            {subtasks.length > 0 && (
                                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                    {subtasks.map((st, i) => (
                                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 rounded-lg px-3 py-2 text-sm">
                                            <span className="text-gray-700 dark:text-gray-300">📌 {st.title || st}</span>
                                            <button type="button" onClick={() => handleRemoveSubtask(i)}
                                                className="text-gray-400 hover:text-red-500 transition-colors">
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Collaborators Section — only for new deadlines */}
                        {!initialData && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                                    <FaUserPlus size={11} /> Share with
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="email"
                                        value={collaboratorEmail}
                                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCollaborator();
                                            }
                                        }}
                                        placeholder="Collaborator's email..."
                                        className="form-input px-3.5 flex-1"
                                    />
                                    <button type="button" onClick={handleAddCollaborator}
                                        className="px-3 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all">
                                        <FaPlus size={12} />
                                    </button>
                                </div>
                                {collaboratorEmails.length > 0 && (
                                    <div className="space-y-1.5">
                                        {collaboratorEmails.map((email, i) => (
                                            <div key={i} className="flex items-center justify-between bg-purple-50 dark:bg-purple-500/10 rounded-lg px-3 py-2 text-sm">
                                                <span className="text-purple-700 dark:text-purple-300">🤝 {email}</span>
                                                <button type="button" onClick={() => handleRemoveCollaborator(i)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors">
                                                    <FaTimes size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800 rounded-b-3xl">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                            Cancel
                        </button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all active:scale-95">
                            {initialData ? 'Update Deadline' : 'Create Deadline'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeadlineModal;
