// server.js
require('dotenv').config(); // Load environment variables FIRST
const app = require('./app');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // adjust path if needed
const Employee = require('./models/Employee');

mongoose.connection.once('open', async () => {
  try {
    // Ensure employees can have duplicate emails: drop unique index if present
    try {
      const indexes = await Employee.collection.indexes();
      const emailIdx = indexes.find((i) => i.name === 'email_1');
      if (emailIdx && emailIdx.unique) {
        await Employee.collection.dropIndex('email_1');
        console.log('✅ Dropped unique index on Employee.email');
      }
    } catch (idxErr) {
      console.warn('ℹ️ Could not inspect/drop Employee.email index:', idxErr?.message || idxErr);
    }

    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // NOTE: do NOT pre-hash the password here. Let the User model's pre('save') hash it.
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: 'admin123',   // <-- plain text here
        role: 'admin',
        isActive: true,
        mfaEnabled: false,
        loginAttempts: 0
      });
      console.log('✅ Default admin account created: admin@gmail.com / admin123');
    } else {
      console.log('✅ Admin account already exists.');
    }
  } catch (err) {
    console.error('❌ Error creating default admin:', err);
  }
});
// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
