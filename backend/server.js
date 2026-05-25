require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Achievement = require('./models/Achievement');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Dynamic origin matching to support local development and any deployed frontend domain
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Load Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const serviceRoutes = require('./routes/services');
const categoryRoutes = require('./routes/categories');
const achievementRoutes = require('./routes/achievements');
const inquiryRoutes = require('./routes/inquiries');
const statsRoutes = require('./routes/stats');
const reviewRoutes = require('./routes/reviews');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/reviews', reviewRoutes);

// Default service categories (seeded on first run)
const DEFAULT_CATEGORIES = [
  'Building Construction',
  'Architectural Planning',
  'Structural Design',
  '2D/3D Elevation Design',
  'Building Renovation',
];

// Default achievement stats (seeded on first run)
const DEFAULT_ACHIEVEMENTS = [
  { label: 'Projects Completed', value: 50, suffix: '+', icon: 'building', order: 0 },
  { label: 'Years of Experience', value: 10, suffix: '+', icon: 'trophy',   order: 1 },
  { label: 'Happy Clients',       value: 100, suffix: '+', icon: 'users',   order: 2 },
  { label: 'Ongoing Projects',    value: 8,   suffix: '+', icon: 'hardhat', order: 3 },
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected');

    try {
      // ── Seed default admin ──────────────────────────────────
      const adminExists = await Admin.findOne({ username: process.env.DEFAULT_ADMIN_USERNAME || 'admin' });
      if (!adminExists) {
        console.log('No admin found, creating default admin...');
        const newAdmin = new Admin({
          username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
          password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
        });
        await newAdmin.save();
        console.log(`Default admin created: ${newAdmin.username}`);
      } else {
        console.log('Admin account exists.');
      }
    } catch (seedErr) {
      console.error('Error during default admin creation:', seedErr);
    }

    try {
      // ── Seed default categories ─────────────────────────────
      const catCount = await Category.countDocuments();
      if (catCount === 0) {
        await Category.insertMany(DEFAULT_CATEGORIES.map(name => ({ name })));
        console.log('Default service categories seeded.');
      }
    } catch (err) {
      console.error('Error seeding categories:', err);
    }

    try {
      // ── Seed default achievements ───────────────────────────
      const achCount = await Achievement.countDocuments();
      if (achCount === 0) {
        await Achievement.insertMany(DEFAULT_ACHIEVEMENTS);
        console.log('Default achievements seeded.');
      }
    } catch (err) {
      console.error('Error seeding achievements:', err);
    }
  })
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
