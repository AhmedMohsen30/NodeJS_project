const router = require('express').Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getMyAppointments,
  payAppointment,
  cancelAppointment,
} = require('../controllers/paymentController');

router.get('/my', protect, getMyAppointments);
router.post('/:id/pay', protect, payAppointment);
router.post('/:id/cancel', protect, cancelAppointment);

module.exports = router;
