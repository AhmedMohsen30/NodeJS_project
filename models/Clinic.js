const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    photos: [String],
    about: String,
    workingHours: { type: String, default: 'Sat - Thu: 8:00 AM - 10:00 PM' },
    specialties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    minPrice: { type: Number, default: 0 },
    maxPrice: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    contact: { phone: String, email: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Clinic', clinicSchema);