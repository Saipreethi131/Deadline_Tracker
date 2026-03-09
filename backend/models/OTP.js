const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    purpose: {
        type: String,
        enum: ['email-change', 'password-reset'],
        default: 'email-change'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // The document will be automatically deleted after 10 minutes
    }
});

module.exports = mongoose.model('OTP', otpSchema);
