require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Clinic routes are already written by the team.
app.use('/api', require('./routes/clinicRoutes'));

// Add these routes when the other team files are ready.
// Keep appointmentActionsRoutes before appointmentRoutes so /my works.
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/doctors', require('./routes/doctorRoutes'));
// app.use('/api/appointments', require('./routes/appointmentActionsRoutes'));
// app.use('/api/appointments', require('./routes/appointmentRoutes'));

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Request failed:', err.message);
  res.status(500).json({ message: 'Server error' });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => console.log('Server running on port ' + port));
  })
  .catch((err) => {
    console.error('Could not start server:', err.message);
    process.exitCode = 1;
  });
