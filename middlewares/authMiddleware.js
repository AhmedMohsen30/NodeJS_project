const jwt = require('jsonwebtoken');
const Patient = require('../models/user');

const protect = async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ message: 'سجل الدخول أولاً' });

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: 'رمز الدخول غير صالح أو انتهت صلاحيته' });
    }

    try {
        const patient = await Patient.findById(decoded.id).select('name email role isVerified');
        if (!patient || !patient.isVerified) {
            return res.status(401).json({ message: 'المستخدم غير موجود أو غير مفعل' });
        }
        req.user = patient;
        next();
    } catch (err) {
        next(err);
    }
};

const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'سجل الدخول أولاً' });
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'ليس لديك صلاحية للوصول لهذا المسار' });
    }
    next();
};

module.exports = { protect, restrictTo };
