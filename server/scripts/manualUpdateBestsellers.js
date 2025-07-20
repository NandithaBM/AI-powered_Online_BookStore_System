const mongoose = require('mongoose');
const { updateBestsellers } = require('../utils/updateBestsellers');

mongoose.connect('mongodb://localhost:27017/books').then(async () => {
  await updateBestsellers();
  mongoose.disconnect();
});
