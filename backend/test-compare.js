// test-compare.js
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/office-management');
    const u = await User.findOne({ email: 'admin@gmail.com' }).select('+password');
    console.log('found user:', !!u);
    if (!u) {
      console.log('User not found');
      return process.exit(0);
    }
    console.log('stored password hash:', u.password);
    const ok = await u.matchPassword('admin123');
    console.log('bcrypt compare result with "admin123":', ok);
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
})();
