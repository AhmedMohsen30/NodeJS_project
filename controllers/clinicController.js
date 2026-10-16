const mongoose = require('mongoose');
const Clinic = require('../models/clinic');
const Doctor = require('../models/doctor');
const Specialty = require('../models/specialty');


const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


exports.getSpecialties = async (req, res, next) => {
  try {
    const data = await Specialty.find().sort('name');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.getClinics = async (req, res, next) => {
  try {
    const { q, specialty, city, featured, sort } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filter = {};
    if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
    if (city) filter.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };
    if (featured === 'true') filter.isFeatured = true;
    if (specialty) {
      const spec = mongoose.isValidObjectId(specialty)
        ? { _id: specialty }
        : { name: { $regex: `^${escapeRegex(specialty)}$`, $options: 'i' } };
      const found = await Specialty.findOne(spec);
      filter.specialties = found ? found._id : null;
    }

    const sorts = {
      rating: { rating: -1 },
      price_asc: { minPrice: 1 },
      price_desc: { minPrice: -1 },
    };

    const total = await Clinic.countDocuments(filter);
    const data = await Clinic.find(filter)
      .populate('specialties', 'name icon')
      .sort(sorts[sort] || { rating: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, pages: Math.ceil(total / limit), data });
  } catch (err) {
    next(err);
  }
};

exports.getClinicById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid clinic id' });
    }
    const clinic = await Clinic.findById(id).populate('specialties', 'name icon');
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    const Doctor = mongoose.models.Doctor;
    const doctors = Doctor ? await Doctor.find({ clinic: id }) : [];

    res.json({ success: true, data: { ...clinic.toObject(), doctors } });
  } catch (err) {
    next(err);
  }
};



exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('clinic', 'name city')
      .populate('specialty', 'name')
      .sort({ doctorNumber: 1 });

    res.json({
      success: true,
      total: doctors.length,
      data: doctors
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorByNumber = async (req, res, next) => {
  try {
    const doctorNumber = Number(req.params.number);

    if (!Number.isInteger(doctorNumber) || doctorNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor number'
      });
    }

    const doctor = await Doctor.findOne({ doctorNumber })
      .populate('clinic', 'name city')
      .populate('specialty', 'name');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (err) {
    next(err);
  }
};
