const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/books';

async function updateMobile() {
  await mongoose.connect(MONGODB_URI);

  // TODO: Edit these values before running
  const email = 'user@example.com'; // <-- set the user's email
  const mobile = '9876543210';      // <-- set the new mobile number (string)

  const result = await User.updateOne(
    { email },
    { $set: { mobile } }
  );

  if (result.modifiedCount > 0) {
    console.log(`Mobile updated for ${email}`);
  } else {
    console.log(`No user found or mobile already set for ${email}`);
  }

  await mongoose.disconnect();
}

updateMobile().catch(err => {
  console.error('Error updating mobile:', err);
  process.exit(1);
}); 