
const Counter = require('../models/Counter');

module.exports = async function generateBookingCode() {
  const year = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }).slice(0, 4);

  const counter = await Counter.findOneAndUpdate(
    { _id: `booking-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // padStart: 48 → "0048"
  return `AP-${year}-${String(counter.seq).padStart(4, '0')}`;
};
