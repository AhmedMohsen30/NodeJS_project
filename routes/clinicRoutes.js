const router = require('express').Router();
const { getSpecialties, getClinics, getClinicById } = require('../controllers/clinicController');

router.get('/specialties', getSpecialties);
router.get('/clinics', getClinics);
router.get('/clinics/:id', getClinicById);

module.exports = router;