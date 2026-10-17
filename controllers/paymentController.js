const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const sendBookingEmail = require('../utils/sendBookingEmail');

const getUserId = (req) => {
  if (req.user && req.user._id) return req.user._id;
  if (req.user && req.user.id) return req.user.id;
  if (req.decoded && req.decoded._id) return req.decoded._id;
  return null;
};

let getMyAppointments = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Login first' });

    const appointments = await Appointment.find({ user: userId })
      .populate('doctor', 'name photo')
      .populate('clinic', 'name city')
      .populate('slot', 'date time')
      .sort({ createdAt: -1 });

    res.json({ message: 'My appointments', appointments });
  } catch (error) {
    res.status(500).json({ message: 'Could not get appointments' });
  }
};

let payAppointment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Login first' });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    // This only works while the booking is waiting for payment and has not expired.
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        user: userId,
        status: 'pending_payment',
        expiresAt: { $gt: new Date() },
      },
      { status: 'confirmed', paymentStatus: 'paid' },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      const myBooking = await Appointment.exists({ _id: req.params.id, user: userId });
      if (!myBooking) return res.status(404).json({ message: 'Booking not found' });
      return res.status(409).json({ message: 'Booking is not waiting for payment' });
    }

    let emailSent = false;
    try {
      await appointment.populate('user');
      await sendBookingEmail(appointment);
      emailSent = true;
    } catch (error) {
      console.error('Confirmation email failed:', error);
    }

    res.json({ message: 'Booking confirmed', appointment, emailSent });
  } catch (error) {
    res.status(500).json({ message: 'Could not confirm booking' });
  }
};

let cancelAppointment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Login first' });
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: userId,
    }).populate('slot');

    if (!appointment) return res.status(404).json({ message: 'Booking not found' });
    if (appointment.status !== 'confirmed' || appointment.paymentStatus !== 'paid') {
      return res.status(409).json({ message: 'Booking is not confirmed and paid' });
    }
    if (!appointment.slot || !appointment.slot.date || !appointment.slot.time) {
      return res.status(409).json({ message: 'Booking time is missing' });
    }

    const [year, month, day] = appointment.slot.date.split('-').map(Number);
    const [hour, minute] = appointment.slot.time.split(':').map(Number);
    const utcTime = Date.UTC(year, month - 1, day, hour, minute);
    const cairoZone = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo', timeZoneName: 'shortOffset',
    }).formatToParts(new Date(utcTime)).find(part => part.type === 'timeZoneName').value;
    const cairoOffset = Number(cairoZone.slice(3));
    const startTime = new Date(utcTime - cairoOffset * 60 * 60 * 1000);
    const hoursLeft = (startTime - new Date()) / (1000 * 60 * 60);
    if (!Number.isFinite(hoursLeft) || hoursLeft <= 0) {
      return res.status(409).json({ message: 'Appointment time has passed' });
    }

    let paymentStatus = 'forfeited';
    if (hoursLeft >= 24) paymentStatus = 'refunded';
    let cancelled;

    // Change the booking and free its slot together.
    await mongoose.connection.transaction(async (session) => {
      cancelled = await Appointment.findOneAndUpdate(
        { _id: appointment._id, user: userId, status: 'confirmed', paymentStatus: 'paid' },
        { status: 'cancelled', paymentStatus },
        { new: true, session, runValidators: true }
      );
      if (!cancelled) {
        const error = new Error('Booking already changed');
        error.statusCode = 409;
        throw error;
      }

      const slotResult = await Slot.updateOne(
        { _id: appointment.slot._id, isBooked: true },
        { isBooked: false },
        { session }
      );
      if (slotResult.matchedCount !== 1) {
        const error = new Error('Slot could not be released');
        error.statusCode = 409;
        throw error;
      }
    });

    res.json({ message: 'Booking cancelled', appointment: cancelled });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Could not cancel booking' });
  }
};

module.exports = { getMyAppointments, payAppointment, cancelAppointment };
