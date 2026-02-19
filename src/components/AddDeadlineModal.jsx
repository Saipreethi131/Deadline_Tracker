import { useState, useEffect } from 'react';
import { FaTimes, FaTag, FaCalendarAlt, FaFlag, FaBell } from 'react-icons/fa';

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

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                deadlineDate: initialData.deadlineDate
                    ? initialData.deadlineDate.split('T')[0]
                    : '',
            });
        } else {
            setFormData({
                title: '', description: '', category: 'assignment',
                customCategoryName: '', deadlineDate: '', priority: 'medium',
                status: 'pending', reminderEnabled: false,
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
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
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg animate-scale-in border border-gray-100 dark:border-gray-700/60">

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

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

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
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
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
                            Enable Reminders
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {initialData ? 'Update Deadline' : 'Create Deadline'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeadlineModal;
