import mongoose from 'mongoose';
import Book from '../models/Book.js';
import fs from 'fs';

const books = JSON.parse(fs.readFileSync('semantic-search/books_meta.json', 'utf-8'));
const semanticIds = books.map(b => b.id);

await mongoose.connect('mongodb://localhost:27017/books');

const dbBooks = await Book.find({}, { _id: 1 });
const dbIds = dbBooks.map(b => b._id.toString());

const missing = semanticIds.filter(id => !dbIds.includes(id));

if (missing.length === 0) {
  console.log('All semantic index book IDs exist in MongoDB!');
} else {
  console.log('Missing book IDs in MongoDB:', missing);
}

process.exit(); 