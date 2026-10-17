const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
    const host = process.env.SMTP_HOST;
    const from = process.env.SMTP_FROM;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !from || Boolean(user) !== Boolean(pass)) {
        throw new Error('SMTP settings are missing');
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const options = { host, port, secure: port === 465 };
    if (user) options.auth = { user, pass };

    const transporter = nodemailer.createTransport(options);
    await transporter.sendMail({ from, to, subject, html });
};

module.exports = sendEmail;
