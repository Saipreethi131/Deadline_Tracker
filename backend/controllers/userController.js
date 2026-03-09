const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    });
});

const OTP = require('../models/OTP');
const { sendVerificationEmail } = require('../services/emailService');

// @desc    Update user profile (name, email)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Handle Name Update immediately
    if (req.body.name && req.body.name !== user.name) {
        user.name = req.body.name;
    }

    // Handle Email Update with OTP Verification
    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
        const newEmail = req.body.email.toLowerCase();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            res.status(400);
            throw new Error('Please provide a valid email address');
        }

        // Check if new email is already taken
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) {
            res.status(400);
            throw new Error('Email already in use');
        }

        // Generate 6 digit OTP
        const otpStr = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTP for this user
        await OTP.deleteMany({ user: user._id });

        // Save new OTP
        await OTP.create({
            user: user._id,
            email: newEmail,
            otp: otpStr
        });

        // Send OTP via email to the new address
        try {
            await sendVerificationEmail(newEmail, user.name, otpStr);
        } catch (emailErr) {
            console.error('Failed to send OTP email:', emailErr.message);
            // Still continue - the OTP is saved and can be resent
        }

        // Save name if changed, but keep old email for now
        await user.save();

        return res.json({
            requiresVerification: true,
            message: `A verification code was sent to ${newEmail}`,
            _id: user._id,
            name: user.name,
            email: user.email // return the current email, it's not changed yet
        });
    }

    // If only name was updated
    const updatedUser = await user.save();

    // Return updated user info with a fresh token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        token,
    });
});

// @desc    Verify OTP and change email
// @route   POST /api/auth/profile/verify-email
// @access  Private
const verifyEmailChange = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        res.status(400);
        throw new Error('Please provide the verification code');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Find the latest OTP for this user
    const otpRecord = await OTP.findOne({ user: user._id }).sort({ createdAt: -1 });

    if (!otpRecord) {
        res.status(400);
        throw new Error('Verification code expired or not found. Please try again.');
    }

    if (otpRecord.otp !== otp) {
        res.status(400);
        throw new Error('Invalid verification code');
    }

    // Verify successful - Update email
    const newEmail = otpRecord.email;
    user.email = newEmail;

    // Check again just in case someone grabbed it in the last 10 minutes
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        res.status(400);
        throw new Error('Email already in use');
    }

    const updatedUser = await user.save();

    // Delete the used OTP record
    await OTP.deleteMany({ user: user._id });

    // Generate fresh token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
        token,
    });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword) {
        res.status(400);
        throw new Error('Please provide a new password');
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Verify current password only if the user has one
    if (user.password) {
        if (!currentPassword) {
            res.status(400);
            throw new Error('Please provide your current password');
        }
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            res.status(401);
            throw new Error('Current password is incorrect');
        }
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
});

// @desc    Delete user account and all their deadlines
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Verify password only if the user has one
    if (user.password) {
        if (!password) {
            res.status(400);
            throw new Error('Please provide your password to confirm deletion');
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            res.status(401);
            throw new Error('Password is incorrect');
        }
    }

    // Delete all user's deadlines
    const Deadline = require('../models/Deadline');
    await Deadline.deleteMany({ user: req.user.id });

    // Delete the user
    await user.deleteOne();

    res.json({ message: 'Account deleted successfully' });
});

module.exports = {
    getProfile,
    updateProfile,
    verifyEmailChange,
    changePassword,
    deleteAccount,
};
