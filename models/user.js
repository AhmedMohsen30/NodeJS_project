const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    phone: String,
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, select: false },
    otpExpires: Date,
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: Date
}, { timestamps: true });

// The booking models use the User model name.
const Patient = mongoose.model('User', patientSchema);
module.exports = Patient;
