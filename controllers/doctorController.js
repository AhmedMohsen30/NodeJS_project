const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.getDoctors = async (req, res) => {
  try {
    const { specialty, clinic, minFee, maxFee, search, sort } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    if ((specialty && !isValidId(specialty)) || (clinic && !isValidId(clinic))) {
      return res.status(400).json({ success: false, message: 'Invalid clinic or specialty id' });
    }
    if ((minFee && !Number.isFinite(Number(minFee))) ||
        (maxFee && !Number.isFinite(Number(maxFee))) ||
        (minFee && maxFee && Number(minFee) > Number(maxFee))) {
      return res.status(400).json({ success: false, message: 'Invalid fee range' });
    }

    const filter = {};
    if (specialty) filter.specialty = specialty;
    if (clinic) filter.clinic = clinic;
    if (minFee || maxFee) {
      filter.fee = {};
      if (minFee) filter.fee.$gte = Number(minFee);
      if (maxFee) filter.fee.$lte = Number(maxFee);
    }
    if (search) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safe, $options: 'i' };
    }

    const sortMap = {
      rating: { rating: -1 },
      fee_asc: { fee: 1 },
      fee_desc: { fee: -1 },
      experience: { experienceYears: -1 },
    };
    const sortBy = sortMap[sort] || { rating: -1 };

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('specialty', 'name icon')
        .populate('clinic', 'name city address')
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: doctors,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDoctorById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!isValidId(id) && !/^\d+$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' });
    }
    const doctorQuery = isValidId(id)
      ? Doctor.findById(id)
      : Doctor.findOne({ doctorNumber: Number(id) });
    const doctor = await doctorQuery
      .populate('specialty', 'name icon')
      .populate('clinic', 'name address city photos workingHours contact');

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDoctorSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!isValidId(id) && !/^\d+$/.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor id' });
    }
    const parsedDate = new Date(date + 'T00:00:00Z');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
      return res
        .status(400)
        .json({ success: false, message: 'date query is required (YYYY-MM-DD)' });
    }

    const doctor = isValidId(id)
      ? await Doctor.findById(id)
      : await Doctor.findOne({ doctorNumber: Number(id) });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const slots = await Slot.find({ doctor: doctor._id, date }).sort({ time: 1 });
    res.json({
      success: true,
      count: slots.length,
      availableCount: slots.filter((slot) => !slot.isBooked).length,
      data: slots,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
