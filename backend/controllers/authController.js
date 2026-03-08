const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const { sendWelcomeEmail } = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
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

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
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
    const { token } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('No Google token provided');
    }

    let ticket;
    try {
        ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
    } catch (err) {
        res.status(401);
        throw new Error('Invalid Google Token');
    }

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload; // sub is the googleId

    let user = await User.findOne({ email });

    if (!user) {
        // Create user if they don't exist
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        user = await User.create({
            name,
            email,
            password: randomPassword,
        });

        // Send welcome email for new Google sign-ups (non-blocking)
        sendWelcomeEmail(user.email, user.name);
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token: generateToken(user._id),
    });
});

module.exports = {
    registerUser,
    loginUser,
    googleAuth,
};
