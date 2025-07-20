const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Book = require('../models/Book');
const User = require('../models/User');
const Order = require('../models/Order');
const { sampleBooks } = require('../data/sampleBooks');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/books';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Book.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({}); // Clear orders as well
    console.log('Cleared existing data');

    // Create sample books
    const books = await Book.insertMany(sampleBooks);
    console.log(`Created ${books.length} sample books`);

    // Create sample users
    const sampleUsers = [
      {
        name: 'Demo User',
        email: 'user@demo.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          bio: 'A passionate reader who loves exploring different genres.',
          favoriteGenres: ['Fiction', 'Science Fiction', 'Mystery'],
          readingGoal: 24,
          location: 'New York, NY'
        },
        preferences: {
          authors: ['George Orwell', 'Jane Austen', 'Frank Herbert'],
          genres: ['Fiction', 'Science Fiction', 'Classic Literature']
        },
        wishlist: [books[0]._id, books[2]._id, books[5]._id],
        viewedBooks: [
          {
            book: books[1]._id,
            dateRead: new Date('2024-01-15'),
            rating: 5
          },
          {
            book: books[3]._id,
            dateRead: new Date('2024-02-20'),
            rating: 4
          }
        ]
      },
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
        profile: {
          bio: 'BookVault administrator and book enthusiast.',
          favoriteGenres: ['All Genres'],
          readingGoal: 50,
          location: 'San Francisco, CA'
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        profile: {
          bio: 'Romance and contemporary fiction lover.',
          favoriteGenres: ['Romance', 'Contemporary Fiction', 'Historical Fiction'],
          readingGoal: 18,
          location: 'Los Angeles, CA'
        },
        preferences: {
          authors: ['Jane Austen', 'Delia Owens'],
          genres: ['Romance', 'Contemporary Fiction']
        },
        wishlist: [books[3]._id, books[7]._id],
        viewedBooks: [
          {
            book: books[8]._id,
            dateRead: new Date('2024-03-10'),
            rating: 4
          }
        ]
      }
    ];

    const users = await User.insertMany(sampleUsers);
    console.log(`Created ${users.length} sample users`);

    // Add some reviews to books
    const reviewsData = [
      {
        bookIndex: 0, // The Great Gatsby
        reviews: [
          {
            user: users[0]._id,
            rating: 4,
            comment: "A beautifully written classic that captures the essence of the American Dream. Fitzgerald's prose is simply magnificent.",
            sentiment: 'positive'
          },
          {
            user: users[2]._id,
            rating: 5,
            comment: "One of the greatest American novels ever written. The symbolism and themes are timeless.",
            sentiment: 'positive'
          }
        ]
      },
      {
        bookIndex: 2, // 1984
        reviews: [
          {
            user: users[0]._id,
            rating: 5,
            comment: "Terrifyingly relevant in today's world. Orwell's vision of surveillance and control is prophetic.",
            sentiment: 'positive'
          },
          {
            user: users[2]._id,
            rating: 4,
            comment: "A powerful dystopian novel that makes you think about freedom and privacy. Highly recommended.",
            sentiment: 'positive'
          }
        ]
      },
      {
        bookIndex: 9, // Atomic Habits
        reviews: [
          {
            user: users[0]._id,
            rating: 5,
            comment: "Life-changing book! The strategies are practical and easy to implement. Already seeing results.",
            sentiment: 'positive'
          },
          {
            user: users[2]._id,
            rating: 5,
            comment: "Best self-help book I've ever read. Clear, actionable advice backed by science.",
            sentiment: 'positive'
          }
        ]
      }
    ];

    // Add reviews to books and update ratings
    for (const reviewData of reviewsData) {
      const book = books[reviewData.bookIndex];
      book.reviews = reviewData.reviews;
      book.updateRatings();
      await book.save();
    }

    console.log('Added sample reviews and updated ratings');

    // Create some sample orders (you can expand this)
    console.log('Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('User: user@demo.com / password123');
    console.log('Admin: admin@demo.com / admin123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedDatabase();