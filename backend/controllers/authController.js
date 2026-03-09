const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { sendWelcomeEmail } = require('../services/emailService');
const { sendPasswordResetEmail, isEmailConfigured } = require('../services/emailService');
const axios = require('axios');
const OTP = require('../models/OTP');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        res.status(400);
        throw new Error('Please provide an email');
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    if (!password) {
        res.status(400);
        throw new Error('Please add a password for manual registration');
    }

    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
    });

    if (user) {
        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.name);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Check if the user has a password (might be a Google-only account)
    if (!user.password) {
        res.status(401);
        throw new Error('This account uses Google sign-in. Please continue with Google, then set a password in Settings if you want manual login.');
    }

    if (await user.matchPassword(password)) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Auth user with Google token
// @route   POST /api/auth/google
// @access  Public
const googleAuth = asyncHandler(async (req, res) => {
    const { token, tokenType } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('No Google token provided');
    }

    let payload;

    if (tokenType === 'access_token') {
        // Handle custom button flow (Access Token)
        try {
            const response = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
            payload = response.data;
        } catch (err) {
            console.error('Google Access Token verification failed:', err.response?.data || err.message);
            res.status(401);
            throw new Error('Invalid Google Access Token (V4-NEW-CODE)');
        }
    } else {
        // Handle standard component flow (ID Token)
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            res.status(401);
            throw new Error('Invalid Google ID Token (V4-NEW-CODE)');
        }
    }

    const { email, name, sub: googleId } = payload;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        res.status(400);
        throw new Error('Google account email is required');
    }

    // 1. Try to find user by googleId
    let user = await User.findOne({ googleId });

    // 2. If not found, try to find by email and link
    if (!user) {
        user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Found by email but no googleId - link them
            user.googleId = googleId;
            await user.save();
        } else {
            res.status(404);
            throw new Error('No account found with this email. Please register first.');
        }
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token: generateToken(user._id),
    });
});

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail) {
        res.status(400);
        throw new Error('Please provide an email');
    }

    if (!isEmailConfigured()) {
        res.status(503);
        throw new Error('Password reset is currently unavailable. Please try again later.');
    }

    const user = await User.findOne({ email: normalizedEmail });

    // Prevent user enumeration by returning a generic success response.
    if (!user) {
        return res.json({ message: 'If an account exists, a reset code has been sent to the email.' });
    }

    const latestOtp = await OTP.findOne({ user: user._id, purpose: 'password-reset' }).sort({ createdAt: -1 });
    if (latestOtp) {
        const secondsSinceLastOtp = Math.floor((Date.now() - latestOtp.createdAt.getTime()) / 1000);
        if (secondsSinceLastOtp < OTP_RESEND_COOLDOWN_SECONDS) {
            res.status(429);
            throw new Error(
                `Please wait ${OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastOtp}s before requesting another reset code.`
            );
        }
    }

    const otpStr = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ user: user._id, purpose: 'password-reset' });
    await OTP.create({
        user: user._id,
        email: user.email,
        otp: otpStr,
        purpose: 'password-reset',
    });

    try {
        await sendPasswordResetEmail(user.email, user.name, otpStr);
    } catch (err) {
        await OTP.deleteMany({ user: user._id, purpose: 'password-reset' });
        res.status(503);
        throw new Error('Failed to send reset code. Please try again.');
    }

    res.json({ message: 'If an account exists, a reset code has been sent to the email.' });
});

// @desc    Verify reset OTP and set new password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const normalizedEmail = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;

    if (!normalizedEmail || !otp || !newPassword) {
        res.status(400);
        throw new Error('Email, verification code, and new password are required');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired reset code');
    }

    const otpRecord = await OTP.findOne({ user: user._id, purpose: 'password-reset' }).sort({ createdAt: -1 });
    if (!otpRecord) {
        res.status(400);
        throw new Error('Invalid or expired reset code');
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        await OTP.deleteMany({ user: user._id, purpose: 'password-reset' });
        res.status(429);
        throw new Error('Too many incorrect attempts. Please request a new reset code.');
    }

    if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        const remaining = OTP_MAX_ATTEMPTS - otpRecord.attempts;
        if (remaining <= 0) {
            await OTP.deleteMany({ user: user._id, purpose: 'password-reset' });
            res.status(429);
            throw new Error('Too many incorrect attempts. Please request a new reset code.');
        }

        res.status(400);
        throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    user.password = newPassword;
    await user.save();
    await OTP.deleteMany({ user: user._id, purpose: 'password-reset' });

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
});

module.exports = {
    registerUser,
    loginUser,
    googleAuth,
    requestPasswordReset,
    resetPassword,
};
