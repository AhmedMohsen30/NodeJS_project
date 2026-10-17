const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    doctorNumber: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    specialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    fee: { type: Number, required: true, min: 0 },
    experienceYears: { type: Number, default: 0, min: 0 },
    photo: { type: String, default: '' },
    about: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

doctorSchema.index({ specialty: 1, clinic: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
