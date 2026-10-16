const sendEmail = require('./sendEmail');

let sendBookingEmail = async (appointment) => {
  if (!appointment.user || !appointment.user.email) {
    throw new Error('User email is missing');
  }

  const html = '<h2>Booking confirmed</h2><p>Your appointment has been confirmed.</p>';
  await sendEmail(appointment.user.email, 'Booking confirmed', html);
};

module.exports = sendBookingEmail;
