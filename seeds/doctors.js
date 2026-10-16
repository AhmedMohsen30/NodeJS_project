
require('dotenv').config({
  path: require('path').join(__dirname, '../.env')
});

const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Specialty = require('../models/Specialty');

const doctors = [
  {
    doctorNumber: 1,
    name: 'Ahmed Mohamed',
    clinicName: 'Al Noor Medical Center',
    specialtyName: 'Cardiology',
    phone: '01012345678',
    email: 'ahmed@example.com',
    about: 'Specialist in heart diseases.'
  },
  {
    doctorNumber: 2,
    name: 'Sara Ahmed',
    clinicName: 'Care Heart Clinic',
    specialtyName: 'Cardiology',
    phone: '01012345679',
    email: 'sara@example.com',
    about: 'Experienced cardiology doctor.'
  },
  {
    doctorNumber: 3,
    name: 'Mohamed Ali',
    clinicName: 'Healthy Kids Clinic',
    specialtyName: 'Pediatrics',
    phone: '01012345680',
    email: 'mohamed@example.com',
    about: 'Specialist in child healthcare.'
  },
  {
    doctorNumber: 4,
    name: 'Mariam Hassan',
    clinicName: 'El Sham Clinic',
    specialtyName: 'Dermatology',
    phone: '01012345681',
    email: 'mariam@example.com',
    about: 'Specialist in skin diseases.'
  },
  {
    doctorNumber: 5,
    name: 'Omar Mostafa',
    clinicName: 'Bone & Joint Center',
    specialtyName: 'Orthopedics',
    phone: '01012345682',
    email: 'omar@example.com',
    about: 'Specialist in bones and joints.'
  }
];

async function seedDoctors() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from .env');
  await mongoose.connect(process.env.MONGODB_URI);

  for (const item of doctors) {
    const clinic = await Clinic.findOne({ name: item.clinicName });
    const specialty = await Specialty.findOne({
      name: item.specialtyName
    });

    if (!clinic || !specialty) {
      throw new Error(
        `Clinic or specialty not found for ${item.name}`
      );
    }

    await Doctor.findOneAndUpdate(
      { doctorNumber: item.doctorNumber },
      {
        ...item,
        clinic: clinic._id,
        specialty: specialty._id
      },
      { upsert: true, new: true, runValidators: true }
    );
  }

  console.log('Seeded 5 doctors successfully');
}

seedDoctors()
  .catch(console.error)
  .finally(async () => {
    await mongoose.disconnect();
  });
