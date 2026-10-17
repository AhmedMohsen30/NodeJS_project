const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

slotSchema.index({ doctor: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);