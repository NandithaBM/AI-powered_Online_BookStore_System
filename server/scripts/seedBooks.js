const mongoose = require('mongoose');
const Book = require('../models/Book');
const fs = require('fs');

const books = JSON.parse(fs.readFileSync('semantic-search/books_meta.json', 'utf-8'));

mongoose.connect('mongodb://localhost:27017/books').then(async () => {
  for (const book of books) {
    await Book.updateOne(
      { _id: book.id },
      { ...book, _id: book.id },
      { upsert: true }
    );
  }
  console.log('Books seeded!');
  mongoose.disconnect();
}); 