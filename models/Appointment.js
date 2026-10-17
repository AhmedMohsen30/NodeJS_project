const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true },        // AP-2026-0048

    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    slot:   { type: mongoose.Schema.Types.ObjectId, ref: 'Slot',   required: true },

    patientName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },

    depositAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'expired'],
      default: 'pending_payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'forfeited'],
      default: 'unpaid',
    },

    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
