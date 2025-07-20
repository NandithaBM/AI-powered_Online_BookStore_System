const mongoose = require('mongoose');
const Book = require('../models/Book');

const MONGO_URI = 'mongodb://localhost:27017/books';

async function markBestsellers() {
  await mongoose.connect(MONGO_URI);
  const books = await Book.find({}).limit(8);
  for (const book of books) {
    book.isBestseller = true;
    book.isActive = true;
    try {
      await book.save();
      console.log(`Marked as bestseller: ${book.title}`);
    } catch (err) {
      console.error(`Failed to mark ${book.title}:`, err.message);
    }
  }
  await mongoose.disconnect();
  console.log('Done.');
}

markBestsellers().catch(err => {
  console.error('Error marking bestsellers:', err);
  if (err.errors) {
    for (const [field, error] of Object.entries(err.errors)) {
      console.error(`Field: ${field}, Error: ${error.message}`);
    }
  }
  process.exit(1);
}); 