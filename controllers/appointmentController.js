const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const generateBookingCode = require('../utils/generateBookingCode');

const PAYMENT_WINDOW_MIN = Number(process.env.PAYMENT_WINDOW_MIN) > 0
  ? Number(process.env.PAYMENT_WINDOW_MIN) : 15;
const DEPOSIT_PERCENT = Number(process.env.DEPOSIT_PERCENT) > 0
  ? Number(process.env.DEPOSIT_PERCENT) : 20;
const EGY_PHONE = /^01[0125][0-9]{8}$/;


exports.createAppointment = async (req, res) => {
  try {
    const { slotId, patientName, phone, dob } = req.body || {};

    if (!slotId || !patientName || !phone || !dob) {
      return res.status(400).json({ message: 'كل البيانات مطلوبة (slotId, patientName, phone, dob)' });
    }
    if (!mongoose.isValidObjectId(slotId)) {
      return res.status(400).json({ message: 'slotId غير صالح' });
    }
    if (typeof patientName !== 'string' || !patientName.trim()) {
      return res.status(400).json({ message: 'اسم المريض غير صحيح' });
    }
    if (typeof phone !== 'string' || !EGY_PHONE.test(phone)) {
      return res.status(400).json({ message: 'رقم الموبايل غير صحيح' });
    }
    const dobDate = new Date(dob + 'T00:00:00Z');
    if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
        Number.isNaN(dobDate.getTime()) || dobDate.toISOString().slice(0, 10) !== dob ||
        dobDate > new Date()) {
      return res.status(400).json({ message: 'تاريخ الميلاد غير صحيح' });
    }

    const slot = await Slot.findById(slotId).populate('doctor');
    if (!slot) return res.status(404).json({ message: 'الميعاد غير موجود' });
    if (slot.isBooked) return res.status(409).json({ message: 'الميعاد ده اتحجز بالفعل' }); // 409 = تعارض
    if (!slot.doctor || !Number.isFinite(slot.doctor.fee)) {
      return res.status(409).json({ message: 'بيانات الطبيب غير مكتملة' });
    }

    const now = new Date();
    const cairoDate = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
    const cairoTime = now.toLocaleTimeString('en-GB', {
      timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    if (slot.date < cairoDate || (slot.date === cairoDate && slot.time <= cairoTime)) {
      return res.status(409).json({ message: 'الميعاد ده فات' });
    }

    const appointment = await mongoose.connection.transaction(async (session) => {
      const locked = await Slot.findOneAndUpdate(
        { _id: slotId, isBooked: false },
        { isBooked: true },
        { new: true, session }
      );
      if (!locked) {
        const error = new Error('الميعاد ده اتحجز بالفعل');
        error.statusCode = 409;
        throw error;
      }

      const depositAmount = Math.round((slot.doctor.fee * DEPOSIT_PERCENT) / 100);
      const created = await Appointment.create([{
        code: await generateBookingCode(),
        user: req.user._id,
        doctor: slot.doctor._id,
        clinic: slot.doctor.clinic,
        slot: slot._id,
        patientName: patientName.trim(),
        phone,
        dob: dobDate,
        depositAmount,
        status: 'pending_payment',
        paymentStatus: 'unpaid',
        expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MIN * 60 * 1000),
      }], { session });
      return created[0];
    });

    return res.status(201).json({ appointment });
  } catch (err) {
    if (err.statusCode === 409) return res.status(409).json({ message: err.message });
    console.error('createAppointment:', err.message);
    res.status(500).json({ message: 'حصل خطأ في السيرفر' });
  }
};


exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'id غير صالح' });
    }

    const appointment = await Appointment.findById(id)
      .populate('doctor', 'name specialty fee photo')
      .populate('clinic', 'name address city')
      .populate('slot', 'date time');

    if (!appointment) return res.status(404).json({ message: 'الحجز غير موجود' });

    const isOwner = appointment.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'مش مسموحلك تشوف الحجز ده' });
    }

    res.json({ appointment });
  } catch (err) {
    console.error('getAppointmentById:', err);
    res.status(500).json({ message: 'حصل خطأ في السيرفر' });
  }
};
