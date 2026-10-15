

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorNumber: {
    type: Number,
    unique: true,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },

  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  },

  phone: String,
  email: String,
  about: String,
  photo: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
