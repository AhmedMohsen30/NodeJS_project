const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const Patient = require('../models/user');
const sendEmail = require('../utils/sendEmail');

const cleanEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const makeOtp = () => crypto.randomInt(100000, 1000000).toString();

const sendOtp = async (email, otp) => {
    const html = `<h2>تفعيل حساب CareClinic</h2><p>كود التفعيل: <b>${otp}</b></p><p>صالح لمدة 10 دقائق.</p>`;
    await sendEmail(email, 'رمز التحقق من حسابك في CareClinic', html);
};

const register = async (req, res) => {
    try {
        const { name, password, phone, email: emailInput } = req.body || {};
        const email = cleanEmail(emailInput);
        if (typeof name !== 'string' || !name.trim() || !validEmail(email) ||
            typeof password !== 'string' || password.length < 8 ||
            (phone !== undefined && typeof phone !== 'string')) {
            return res.status(400).json({ message: 'أدخل الاسم وبريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل' });
        }

        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(409).json({ message: 'البريد الإلكتروني مسجل من قبل' });
        }

        const otp = makeOtp();
        const newPatient = await Patient.create({
            name: name.trim(),
            email,
            password: await bcrypt.hash(password, 10),
            phone: phone ? phone.trim() : undefined,
            otpHash: await bcrypt.hash(otp, 10),
            otpExpires: new Date(Date.now() + 10 * 60 * 1000)
        });

        try {
            await sendOtp(email, otp);
            newPatient.otpLastSentAt = new Date();
            await newPatient.save();
        } catch (err) {
            console.error('Email sending failed:', err.message);
            return res.status(503).json({
                message: 'تم إنشاء الحساب لكن تعذر إرسال الكود. حاول إعادة الإرسال.',
                patientId: newPatient._id
            });
        }

        res.status(201).json({ message: 'تم التسجيل وإرسال كود التفعيل', patientId: newPatient._id });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ message: 'البريد الإلكتروني مسجل من قبل' });
        console.error('Registration failed:', err.message);
        res.status(500).json({ message: 'تعذر إنشاء الحساب' });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email: emailInput, otp } = req.body || {};
        const email = cleanEmail(emailInput);
        if (!validEmail(email) || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'أدخل البريد وكود التفعيل المكون من 6 أرقام' });
        }

        const patient = await Patient.findOne({ email }).select('+otpHash');
        if (!patient) return res.status(404).json({ message: 'المستخدم غير موجود' });
        if (patient.isVerified) return res.status(400).json({ message: 'الحساب مفعل بالفعل' });
        if (patient.otpAttempts >= 5) return res.status(429).json({ message: 'محاولات كثيرة. اطلب كودًا جديدًا' });
        if (!patient.otpHash || !patient.otpExpires || patient.otpExpires <= new Date()) {
            return res.status(400).json({ message: 'انتهت صلاحية الكود. اطلب كودًا جديدًا' });
        }

        const correct = await bcrypt.compare(otp, patient.otpHash);
        if (!correct) {
            patient.otpAttempts += 1;
            await patient.save();
            return res.status(400).json({ message: 'كود التفعيل غير صحيح' });
        }

        patient.isVerified = true;
        patient.otpHash = undefined;
        patient.otpExpires = undefined;
        patient.otpAttempts = 0;
        await patient.save();
        res.json({ message: 'تم تفعيل الحساب بنجاح' });
    } catch (err) {
        console.error('Verification failed:', err.message);
        res.status(500).json({ message: 'تعذر تفعيل الحساب' });
    }
};

const resendOtp = async (req, res) => {
    try {
        const email = cleanEmail((req.body || {}).email);
        if (!validEmail(email)) return res.status(400).json({ message: 'أدخل بريدًا صحيحًا' });

        const patient = await Patient.findOne({ email });
        if (!patient) return res.status(404).json({ message: 'المستخدم غير موجود' });
        if (patient.isVerified) return res.status(400).json({ message: 'الحساب مفعل بالفعل' });
        if (patient.otpLastSentAt && Date.now() - patient.otpLastSentAt.getTime() < 60 * 1000) {
            return res.status(429).json({ message: 'انتظر دقيقة قبل إعادة إرسال الكود' });
        }

        const otp = makeOtp();
        patient.otpHash = await bcrypt.hash(otp, 10);
        patient.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        patient.otpAttempts = 0;
        await patient.save();

        try {
            await sendOtp(email, otp);
            patient.otpLastSentAt = new Date();
            await patient.save();
        } catch (err) {
            console.error('Email sending failed:', err.message);
            return res.status(503).json({ message: 'تعذر إرسال الكود. حاول لاحقًا' });
        }

        res.json({ message: 'تم إرسال كود جديد' });
    } catch (err) {
        console.error('Resending OTP failed:', err.message);
        res.status(500).json({ message: 'تعذر إرسال كود جديد' });
    }
};

const login = async (req, res) => {
    try {
        const { email: emailInput, password } = req.body || {};
        const email = cleanEmail(emailInput);
        if (!validEmail(email) || typeof password !== 'string') {
            return res.status(400).json({ message: 'أدخل البريد وكلمة المرور' });
        }

        const patient = await Patient.findOne({ email }).select('+password');
        if (!patient || !await bcrypt.compare(password, patient.password)) {
            return res.status(401).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        if (!patient.isVerified) {
            return res.status(403).json({ message: 'فعّل بريدك الإلكتروني أولاً' });
        }

        const token = jwt.sign(
            { id: patient._id.toString(), role: patient.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            token,
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                role: patient.role,
                isVerified: patient.isVerified
            }
        });
    } catch (err) {
        console.error('Login failed:', err.message);
        res.status(500).json({ message: 'تعذر تسجيل الدخول' });
    }
};

module.exports = { register, verifyEmail, resendOtp, login };
