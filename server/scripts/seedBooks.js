import mongoose from 'mongoose';
import Book from '../models/Book.js';
import fs from 'fs';

const books = JSON.parse(fs.readFileSync('semantic-search/books_meta.json', 'utf-8'));

await mongoose.connect('mongodb://localhost:27017/books');

for (const book of books) {
  await Book.updateOne(
    { _id: book.id },
    { ...book, _id: book.id },
    { upsert: true }
  );
}

console.log('Books seeded!');
process.exit(); 