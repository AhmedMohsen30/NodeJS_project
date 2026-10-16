require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');
const Clinic = require('../models/Clinic');

const specialties = [
  { name: 'Cardiology', icon: 'heart' },
  { name: 'Dermatology', icon: 'skin' },
  { name: 'Pediatrics', icon: 'child' },
  { name: 'Internal Medicine', icon: 'stethoscope' },
  { name: 'Orthopedics', icon: 'bone' },
  { name: 'Gynecology', icon: 'female' },
];

const rows = [
  ['Al Noor Medical Center', 'Cairo', 'Nasr City', ['Cardiology', 'Internal Medicine'], 4.5, 130, 300, 500, true],
  ['Care Heart Clinic', 'Cairo', 'Heliopolis', ['Cardiology'], 4.3, 98, 350, 500, true],
  ['New Life Hospital', 'Giza', '6th of October', ['Pediatrics', 'Internal Medicine'], 4.6, 156, 400, 700, true],
  ['Al Salam Medical Center', 'Cairo', 'Maadi', ['Internal Medicine', 'Dermatology'], 4.4, 87, 300, 550, false],
  ['Healthy Kids Clinic', 'Cairo', 'New Cairo', ['Pediatrics'], 4.7, 200, 250, 400, true],
  ['El Sham Clinic', 'Giza', 'Dokki', ['Dermatology', 'Gynecology'], 4.2, 65, 200, 350, false],
  ['Bone & Joint Center', 'Alexandria', 'Smouha', ['Orthopedics'], 4.5, 74, 350, 600, false],
  ['Mother Care Clinic', 'Alexandria', 'Sidi Gaber', ['Gynecology', 'Pediatrics'], 4.6, 110, 300, 500, false],
  ['Skin Plus Clinic', 'Cairo', 'Zamalek', ['Dermatology'], 4.1, 52, 400, 800, false],
  ['Delta Medical Center', 'Mansoura', 'El Gomhoria St', ['Internal Medicine', 'Cardiology'], 4.0, 40, 150, 300, false],
];

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from .env');
  await mongoose.connect(process.env.MONGODB_URI);

  const specDocs = [];
  for (const specialty of specialties) {
    const saved = await Specialty.findOneAndUpdate(
      { name: specialty.name },
      { $setOnInsert: specialty },
      { upsert: true, new: true }
    );
    specDocs.push(saved);
  }
  const idOf = Object.fromEntries(specDocs.map((s) => [s.name, s._id]));

  for (const [name, city, address, specs, rating, reviewsCount, minPrice, maxPrice, isFeatured] of rows) {
    await Clinic.findOneAndUpdate(
      { name },
      { $setOnInsert: {
      name, city, address, rating, reviewsCount, minPrice, maxPrice, isFeatured,
      specialties: specs.map((s) => idOf[s]),
      about: `${name} provides high-quality healthcare with a team of experienced doctors.`,
      contact: { phone: '+20 2 26123456', email: 'info@clinic.com' },
      } },
      { upsert: true, new: true }
    );
  }

  console.log('Seeded 6 specialties and 10 clinics');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
