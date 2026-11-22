const path = require('path');
const express = require('express');
require('dotenv').config();

const { testConnection } = require('./backend/config/db');
const { UPLOADS_ROOT } = require('./backend/config/upload');
const dashboardRoutes = require('./backend/routes/dashboardRoutes');
const serviceRoutes = require('./backend/routes/serviceRoutes');
const adminServiceRoutes = require('./backend/routes/adminServiceRoutes');
const customerModel = require('./backend/models/customerModel');
const authRoutes = require('./backend/routes/authRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(
  '/uploads',
  express.static(UPLOADS_ROOT, {
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  })
);

app.get('/', (req, res) => res.redirect('/admin/customer/html/register.html'));
app.get('/admin', (req, res) => res.redirect('/admin/html/dashboard.html'));

app.use('/api/services', serviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/services', adminServiceRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

app.use((error, req, res, next) => {
  const isClientError = error.status >= 400 && error.status < 500;

  if (!isClientError) console.error(error);

  res.status(isClientError ? error.status : 500).json({
    message: isClientError ? 'Invalid request.' : 'Something went wrong. Please try again.',
  });
});

app.listen(PORT, async () => {
  console.log(`BRB Studios running at http://localhost:${PORT}`);

  try {
    await testConnection();
    console.log('Database connected');
    const problems = await customerModel.verifySchema();
    problems.forEach((p) => console.warn(`Database warning: ${p}`));
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
  }
});
