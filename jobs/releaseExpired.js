const cron = require('node-cron');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

async function releaseExpired() {
  const expired = await Appointment.find({
    status: 'pending_payment',
    expiresAt: { $lte: new Date() },
  }).select('_id slot');

  let released = 0;
  for (const appt of expired) {
    const didRelease = await mongoose.connection.transaction(async (session) => {
      const updated = await Appointment.findOneAndUpdate(
        { _id: appt._id, status: 'pending_payment', expiresAt: { $lte: new Date() } },
        { status: 'expired' },
        { new: true, session, runValidators: true }
      );
      if (!updated) return false;
      await Slot.updateOne({ _id: appt.slot }, { isBooked: false }, { session });
      return true;
    });
    if (didRelease) released++;
  }

  if (released) console.log(`[releaseExpired] released ${released} appointment(s)`);
}

module.exports = function startReleaseExpiredJob() {
  cron.schedule('* * * * *', () => {
    releaseExpired().catch((err) => console.error('[releaseExpired] error:', err));
  });
  console.log('[releaseExpired] job started (every minute)');
};

module.exports.releaseExpired = releaseExpired;
