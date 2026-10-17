require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Specialty = require('../models/Specialty');

const doctorsData = [
  { name: 'Ahmed Mohamed', experienceYears: 10 },
  { name: 'Sara Ahmed', experienceYears: 8 },
  { name: 'Mohamed Ali', experienceYears: 7 },
  { name: 'Mariam Hassan', experienceYears: 9 },
  { name: 'Omar Mostafa', experienceYears: 11 },
  { name: 'Nour Mahmoud', experienceYears: 6 },
  { name: 'Youssef Adel', experienceYears: 12 },
  { name: 'Hana Khaled', experienceYears: 5 },
  { name: 'Karim Samir', experienceYears: 9 },
  { name: 'Dina Tarek', experienceYears: 7 },
  { name: 'Mostafa Ibrahim', experienceYears: 13 },
  { name: 'Salma Nabil', experienceYears: 6 },
  { name: 'Ali Hassan', experienceYears: 8 },
  { name: 'Farah Ahmed', experienceYears: 10 },
  { name: 'Amr Hossam', experienceYears: 7 },
];

const seedDoctors = async () => {
  const clinics = await Clinic.find().sort({ name: 1 });
  const specialties = await Specialty.find();
  if (!clinics.length || !specialties.length) {
    throw new Error('No clinics or specialties found');
  }

  for (let i = 0; i < doctorsData.length; i++) {
    const data = doctorsData[i];
    const doctorNumber = i + 1;
    const existing = await Doctor.findOne({ doctorNumber });

    if (existing) {
      if (existing.fee == null) {
        const clinic = clinics.find(c => String(c._id) === String(existing.clinic));
        existing.fee = clinic ? clinic.minPrice : 250;
        existing.experienceYears = data.experienceYears;
        await existing.save();
      }
      continue;
    }

    const clinic = clinics[i % clinics.length];
    const specialty = clinic.specialties.length
      ? clinic.specialties[i % clinic.specialties.length]
      : specialties[i % specialties.length]._id;

    await Doctor.create({
      doctorNumber,
      name: data.name,
      clinic: clinic._id,
      specialty,
      fee: clinic.minPrice,
      experienceYears: data.experienceYears,
      photo: '',
      about: '',
      rating: 0,
    });
  }

  console.log(`Ready: ${doctorsData.length} doctors`);
};

module.exports = seedDoctors;

if (require.main === module) {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from .env');
  mongoose.connect(process.env.MONGODB_URI)
    .then(seedDoctors)
    .catch(err => { console.error(err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
