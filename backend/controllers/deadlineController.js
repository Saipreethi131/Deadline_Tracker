const asyncHandler = require('express-async-handler');
const Deadline = require('../models/Deadline');
const User = require('../models/User');
const { sendReminderEmail, sendTestEmail, isEmailConfigured, sendCollaborationInviteEmail } = require('../services/emailService');

// Helper: check if user is owner or collaborator
const canAccess = (deadline, userId) => {
    if (deadline.user.toString() === userId) return 'owner';
    const collab = deadline.collaborators?.find(c => c.user.toString() === userId && c.status === 'accepted');
    return collab ? 'collaborator' : null;
};

// @desc    Get reminder system status
// @route   GET /api/deadlines/reminder-status
// @access  Private
const getReminderStatus = asyncHandler(async (req, res) => {
    const configured = isEmailConfigured();

    // Count how many of the user's deadlines have reminders enabled
    const enabledCount = await Deadline.countDocuments({
        user: req.user.id,
        reminderEnabled: true,
        status: 'pending',
    });

    res.json({
        emailConfigured: configured,
        remindersEnabledCount: enabledCount,
        schedule: ['7 days before', '3 days before', '1 day before', 'Day of deadline'],
        scheduleCron: 'Daily at 8:00 AM IST',
    });
});

// @desc    Send a test reminder email for a specific deadline
// @route   POST /api/deadlines/:id/test-reminder
// @access  Private
const sendTestReminderForDeadline = asyncHandler(async (req, res) => {
    if (!isEmailConfigured()) {
        res.status(503);
        throw new Error(
            'Email is not configured. Please set EMAIL_USER and EMAIL_PASS in the backend .env file.'
        );
    }

    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Calculate days left
    const now = new Date();
    const deadlineDate = new Date(deadline.deadlineDate);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

    await sendReminderEmail(
        req.user.email,
        req.user.name,
        deadline,
        daysLeft
    );

    res.json({
        message: `Test reminder sent to ${req.user.email}`,
        daysLeft,
    });
});

// @desc    Send a test email to verify configuration
// @route   POST /api/deadlines/test-email
// @access  Private
const sendTestEmailEndpoint = asyncHandler(async (req, res) => {
    if (!isEmailConfigured()) {
        res.status(503);
        throw new Error(
            'Email is not configured. Please set EMAIL_USER and EMAIL_PASS in the backend .env file.'
        );
    }

    await sendTestEmail(req.user.email);

    res.json({
        message: `Test email sent successfully to ${req.user.email}`,
    });
});

// @desc    Get all deadlines
// @route   GET /api/deadlines
// @access  Private
const getDeadlines = asyncHandler(async (req, res) => {
    const ownDeadlines = await Deadline.find({ user: req.user.id })
        .populate('user', 'name email')
        .populate('collaborators.user', 'name email');
    const sharedDeadlines = await Deadline.find({ 'collaborators.user': req.user.id })
        .populate('user', 'name email')
        .populate('collaborators.user', 'name email');

    // Merge and deduplicate
    const allIds = new Set();
    const all = [];
    [...ownDeadlines, ...sharedDeadlines].forEach(d => {
        const id = d._id.toString();
        if (!allIds.has(id)) {
            allIds.add(id);
            all.push(d);
        }
    });

    res.status(200).json(all);
});

// @desc    Get upcoming deadlines (next 7 days)
// @route   GET /api/deadlines/upcoming
// @access  Private
const getUpcomingDeadlines = asyncHandler(async (req, res) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const deadlines = await Deadline.find({
        user: req.user.id,
        deadlineDate: {
            $gte: today,
            $lte: nextWeek
        },
        status: { $ne: 'completed' } // Optionally exclude completed tasks
    }).sort({ deadlineDate: 1 }).populate('user', 'name email');

    res.status(200).json(deadlines);
});

// @desc    Create a deadline
// @route   POST /api/deadlines
// @access  Private
const createDeadline = asyncHandler(async (req, res) => {
    if (!req.body.title || !req.body.deadlineDate || !req.body.category) {
        res.status(400);
        throw new Error('Please add all required fields');
    }

    // Validate collaborator emails FIRST
    const targetUsers = [];
    if (req.body.collaboratorEmails && req.body.collaboratorEmails.length > 0) {
        for (const email of req.body.collaboratorEmails) {
            const targetUser = await User.findOne({ email: email.toLowerCase() });
            if (!targetUser) {
                res.status(404);
                throw new Error(`No DeadlinePro user found with email: ${email}. They need to sign up first.`);
            }
            if (targetUser._id.toString() === req.user.id) {
                res.status(400);
                throw new Error('You cannot share a deadline with yourself');
            }
            // Add if not already present
            if (!targetUsers.some(u => u._id.toString() === targetUser._id.toString())) {
                targetUsers.push(targetUser);
            }
        }
    }

    // Now safely create the deadline
    const deadline = await Deadline.create({
        user: req.user.id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        customCategoryName: req.body.customCategoryName,
        deadlineDate: req.body.deadlineDate,
        status: req.body.status,
        priority: req.body.priority,
        reminderEnabled: req.body.reminderEnabled,
        subtasks: req.body.subtasks || [],
        collaborators: targetUsers.map(u => ({ user: u._id }))
    });

    // Send notification emails (non-blocking)
    targetUsers.forEach(u => {
        sendCollaborationInviteEmail(u.email, u.name, req.user.name, deadline.title);
    });

    const populated = await Deadline.findById(deadline._id)
        .populate('user', 'name email')
        .populate('collaborators.user', 'name email');

    res.status(200).json(populated);
});

// @desc    Update a deadline
// @route   PUT /api/deadlines/:id
// @access  Private
const updateDeadline = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    const role = canAccess(deadline, req.user.id);
    if (!role) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const ownerFields = [
        'title',
        'description',
        'category',
        'customCategoryName',
        'deadlineDate',
        'status',
        'priority',
        'reminderEnabled',
        'notes',
        'subtasks',
    ];
    const collaboratorFields = ['status', 'notes', 'subtasks'];
    const allowedFields = role === 'owner' ? ownerFields : collaboratorFields;

    const updates = Object.fromEntries(
        Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    const updatedDeadline = await Deadline.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
    });

    res.status(200).json(updatedDeadline);
});

// @desc    Delete a deadline
// @route   DELETE /api/deadlines/:id
// @access  Private
const deleteDeadline = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await deadline.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Update notes for a deadline
// @route   PATCH /api/deadlines/:id/notes
// @access  Private
const updateNotes = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    deadline.notes = req.body.notes ?? deadline.notes;
    await deadline.save();

    res.status(200).json({ id: deadline._id, notes: deadline.notes });
});

// ─── Sub-task Endpoints ───

// @desc    Add a sub-task to a deadline
// @route   POST /api/deadlines/:id/subtasks
// @access  Private (owner or collaborator)
const addSubtask = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    const role = canAccess(deadline, req.user.id);
    if (!role) { res.status(401); throw new Error('User not authorized'); }

    const { title } = req.body;
    if (!title) { res.status(400); throw new Error('Sub-task title is required'); }

    deadline.subtasks.push({ title, completed: false });
    await deadline.save();

    res.status(200).json(deadline);
});

// @desc    Toggle a sub-task's completion
// @route   PATCH /api/deadlines/:id/subtasks/:subtaskId
// @access  Private (owner or collaborator)
const toggleSubtask = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    const role = canAccess(deadline, req.user.id);
    if (!role) { res.status(401); throw new Error('User not authorized'); }

    const subtask = deadline.subtasks.id(req.params.subtaskId);
    if (!subtask) { res.status(404); throw new Error('Sub-task not found'); }

    subtask.completed = !subtask.completed;
    await deadline.save();

    res.status(200).json(deadline);
});

// @desc    Delete a sub-task
// @route   DELETE /api/deadlines/:id/subtasks/:subtaskId
// @access  Private (owner only)
const deleteSubtask = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401); throw new Error('Only the owner can delete sub-tasks');
    }

    deadline.subtasks = deadline.subtasks.filter(
        st => st._id.toString() !== req.params.subtaskId
    );
    await deadline.save();

    res.status(200).json(deadline);
});

// ─── Collaboration Endpoints ───

// @desc    Share a deadline with another user (by email)
// @route   POST /api/deadlines/:id/share
// @access  Private (owner only)
const shareDeadline = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401); throw new Error('Only the owner can share this deadline');
    }

    const { email } = req.body;
    if (!email) { res.status(400); throw new Error('Email is required'); }

    const normalizedEmail = email.toLowerCase().trim();
    const targetUser = await User.findOne({ email: normalizedEmail });
    if (!targetUser) {
        res.status(404);
        throw new Error('No DeadlinePro user found with that email. They need to sign up first.');
    }

    if (targetUser._id.toString() === req.user.id) {
        res.status(400); throw new Error('You cannot share a deadline with yourself');
    }

    // Check if already a collaborator
    const alreadyShared = deadline.collaborators.some(
        c => c.user.toString() === targetUser._id.toString()
    );
    if (alreadyShared) {
        res.status(400); throw new Error('This deadline is already shared with this user');
    }

    deadline.collaborators.push({ user: targetUser._id });
    await deadline.save();

    // Send notification email (non-blocking)
    sendCollaborationInviteEmail(targetUser.email, targetUser.name, req.user.name, deadline.title);

    const populated = await Deadline.findById(deadline._id).populate('collaborators.user', 'name email');
    res.status(200).json(populated);
});

// @desc    Remove a collaborator
// @route   DELETE /api/deadlines/:id/share/:userId
// @access  Private (owner only)
const removeCollaborator = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    if (deadline.user.toString() !== req.user.id) {
        res.status(401); throw new Error('Only the owner can remove collaborators');
    }

    deadline.collaborators = deadline.collaborators.filter(
        c => c.user.toString() !== req.params.userId
    );
    await deadline.save();

    const populated = await Deadline.findById(deadline._id).populate('collaborators.user', 'name email');
    res.status(200).json(populated);
});

// @desc    Accept a collaboration invite
// @route   POST /api/deadlines/:id/accept
// @access  Private
const acceptInvite = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    const collab = deadline.collaborators.find(c => c.user.toString() === req.user.id);
    if (!collab) { res.status(404); throw new Error('Invite not found'); }

    collab.status = 'accepted';
    await deadline.save();

    const populated = await Deadline.findById(deadline._id).populate('collaborators.user', 'name email');
    res.status(200).json(populated);
});

// @desc    Reject a collaboration invite
// @route   POST /api/deadlines/:id/reject
// @access  Private
const rejectInvite = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);
    if (!deadline) { res.status(404); throw new Error('Deadline not found'); }

    deadline.collaborators = deadline.collaborators.filter(c => c.user.toString() !== req.user.id);
    await deadline.save();

    // just return the ID since the deadline is no longer theirs
    res.status(200).json({ id: deadline._id, removed: true });
});

module.exports = {
    getDeadlines,
    getUpcomingDeadlines,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    updateNotes,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    shareDeadline,
    removeCollaborator,
    acceptInvite,
    rejectInvite,
    getReminderStatus,
    sendTestReminderForDeadline,
    sendTestEmailEndpoint,
};
