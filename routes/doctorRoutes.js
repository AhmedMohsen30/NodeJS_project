const router = require('express').Router();
const {
  getDoctors,
  getDoctorById,
  getDoctorSlots,
} = require('../controllers/doctorController');

router.get('/', getDoctors);
router.get('/:id/slots', getDoctorSlots);
router.get('/:id', getDoctorById);

module.exports = router;
