
const router = require('express').Router();

const {
  getSpecialties,
  getClinics,
  getClinicById,
  getDoctors,
  getDoctorByNumber
} = require('../controllers/clinicController');

router.get('/specialties', getSpecialties);
router.get('/clinics', getClinics);
router.get('/clinics/:id', getClinicById);
router.get('/doctors', getDoctors);
router.get('/doctors/:number',getDoctorByNumber);

module.exports = router;
