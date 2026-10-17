require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

const DAYS = 14;
const START_HOUR = 9;
const END_HOUR = 17;

const formatDate = (d) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const seedSlots = async () => {
  const doctors = await Doctor.find().select('_id');
  if (!doctors.length) throw new Error('No doctors found');

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const start = new Date(today + 'T00:00:00Z');
  const dates = [];
  const slots = [];

  for (let i = 0; i < DAYS; i++) {
    dates.push(formatDate(new Date(start.getTime() + i * 86400000)));
  }

  for (const doctor of doctors) {
    for (const date of dates) {
      for (let h = START_HOUR; h < END_HOUR; h++) {
        slots.push({
          doctor: doctor._id,
          date,
          time: `${String(h).padStart(2, '0')}:00`,
          isBooked: false,
        });
      }
    }
  }

  const saved = await Slot.find({
    doctor: { $in: doctors.map(d => d._id) },
    date: { $in: dates },
  }).select('doctor date time');
  const keys = new Set(saved.map(s => `${s.doctor}-${s.date}-${s.time}`));
  const missing = slots.filter(s => !keys.has(`${s.doctor}-${s.date}-${s.time}`));

  if (missing.length) await Slot.insertMany(missing);
  console.log(`Ready: ${slots.length} slots for ${doctors.length} doctors`);
};

module.exports = seedSlots;

if (require.main === module) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from .env');
  mongoose.connect(process.env.MONGODB_URI)
    .then(seedSlots)
    .catch(err => { console.error(err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
