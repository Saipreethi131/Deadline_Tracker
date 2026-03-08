const mongoose = require('mongoose');

const deadlineSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a title'],
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        category: {
            type: String,
            enum: ['assignment', 'internship', 'job', 'hackathon', 'custom'],
            required: [true, 'Please specify a category']
        },
        customCategoryName: {
            type: String,
            trim: true
        },
        deadlineDate: {
            type: Date,
            required: [true, 'Please specify a deadline date']
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'missed'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        reminderEnabled: {
            type: Boolean,
            default: false
        },
        lastReminderSentAt: {
            type: Date,
            default: null
        },
        reminderHistory: [{
            sentAt: { type: Date, required: true },
            daysBeforeDeadline: { type: Number, required: true }
        }],
        notes: {
            type: String,
            default: '',
            trim: true
        },
        subtasks: [{
            title: { type: String, required: true, trim: true },
            completed: { type: Boolean, default: false },
            assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
        }],
        collaborators: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            role: { type: String, enum: ['collaborator'], default: 'collaborator' },
            status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
            addedAt: { type: Date, default: Date.now }
        }],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'User is required'],
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
);

// Add unique compound index if necessary, but request asks for indexing on userId and deadlineDate
deadlineSchema.index({ user: 1 });
deadlineSchema.index({ deadlineDate: 1 });

module.exports = mongoose.model('Deadline', deadlineSchema);
