
const router = require('express').Router();
const { protect } = require('../middlewares/authMiddleware');
const { createAppointment, getAppointmentById } = require('../controllers/appointmentController');

router.post('/', protect, createAppointment);
router.get('/:id', protect, getAppointmentById);

module.exports = router;
