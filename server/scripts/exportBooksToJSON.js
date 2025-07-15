const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('../models/Book');

async function exportBooks() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const books = await Book.find({
      stock: { $gt: 0 },
    }).select('_id title author genre description coverImage price');

    const simplified = books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      genre: Array.isArray(book.genre) ? book.genre.join(', ') : book.genre,
      description: book.description,
      coverImage: book.coverImage,
      price: book.price,
    }));

    const outputPath = path.join(__dirname, '../../semantic-search/books_meta.json');
    fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2));

    console.log(`✅ Exported ${books.length} books to books_meta.json`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to export books:', err);
    process.exit(1);
  }
}

exportBooks();
