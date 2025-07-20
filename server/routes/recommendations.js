const express = require('express');
const router = express.Router();
const Book = require('../models/Book.js');
const User = require('../models/User.js');
const { auth } = require('../middleware/auth.js');
const axios = require('axios');
const Order = require('../models/Order.js');

// Get personalized recommendations
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('viewedBooks.book')
      .populate('wishlist');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Simple recommendation algorithm based on user preferences and history
    const recommendations = await generateRecommendations(user);

    res.json({
      recommendations,
      lastUpdated: user.recommendations.lastUpdated,
      explanations: recommendations.map(rec => ({
        bookId: rec._id,
        reason: rec.recommendationReason,
      })),
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Personalized recommendations via Python AI service
router.get('/personalized-recommendations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('viewedBooks.book', 'title author genre coverImage')
      .populate('wishlist', 'title author genre coverImage');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch user's orders and extract genres/authors
    const orders = await Order.find({ user: user._id }).populate('items.book', 'title author genre');
    const orderGenres = new Set();
    const orderAuthors = new Set();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.book) {
          if (Array.isArray(item.book.genre)) {
            item.book.genre.forEach(g => orderGenres.add(g));
          } else if (item.book.genre) {
            orderGenres.add(item.book.genre);
          }
          if (item.book.author) orderAuthors.add(item.book.author);
        }
      });
    });

    // Merge with user preferences
    const preferences = {
      genres: Array.from(new Set([...(user.preferences?.genres || []), ...orderGenres])),
      authors: Array.from(new Set([...(user.preferences?.authors || []), ...orderAuthors])),
      languages: user.preferences?.languages || [],
      priceRange: user.preferences?.priceRange || { min: 0, max: 100 },
    };

    // Prepare data for Python service
    const payload = {
      preferences,
      wishlist: user.wishlist.map(book => ({
        _id: book._id,
        title: book.title,
        author: book.author,
        genre: book.genre,
      })),
      viewedBooks: user.viewedBooks.map(entry => ({
        book: entry.book ? {
          _id: entry.book._id,
          title: entry.book.title,
          author: entry.book.author,
          genre: entry.book.genre,
        } : null,
        rating: entry.rating,
        dateViewed: entry.dateViewed,
      })),
    };

    console.log('Personalized recs payload:', JSON.stringify(payload, null, 2));

    // Call Python AI service
    const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000/personalized-recommend';
    const response = await axios.post(PYTHON_SERVICE_URL, payload);

    // Pass through recommendations with explanations
    res.json({
      recommendations: response.data || [],
    });
  } catch (error) {
    console.error('Personalized recommendations error:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch personalized recommendations' });
  }
});

// Get similar books
router.get('/similar/:bookId', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Find similar books based on genre, author, and tags
    const similarBooks = await Book.find({
      _id: { $ne: book._id },
      isActive: true,
      $or: [
        { genre: { $in: book.genre } },
        { author: book.author },
        { tags: { $in: book.tags } },
      ],
    })
    .sort({ 'ratings.average': -1 })
    .limit(6);

    res.json(similarBooks);
  } catch (error) {
    console.error('Get similar books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Trending books
router.get('/trending', async (req, res) => {
  try {
    // Books with high ratings and recent activity
    const trendingBooks = await Book.find({
      isActive: true,
      'ratings.count': { $gte: 5 },
      'ratings.average': { $gte: 4.0 },
    })
    .sort({ 
      'inventory.sold': -1,
      'ratings.average': -1,
      createdAt: -1,
    })
    .limit(12);

    res.json(trendingBooks);
  } catch (error) {
    console.error('Get trending books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate recommendations
async function generateRecommendations(user) {
  const recommendations = [];
  const userGenres = new Set();
  const userAuthors = new Set();

  // Collect user preferences from viewed books
  user.viewedBooks.forEach(entry => {
    if (entry.book && entry.rating >= 4) {
      entry.book.genre.forEach(genre => userGenres.add(genre));
      userAuthors.add(entry.book.author);
    }
  });

  // Add preferred genres from user preferences
  if (user.preferences.genres) {
    user.preferences.genres.forEach(genre => userGenres.add(genre));
  }

  // Add preferred authors from user preferences
  if (user.preferences.authors) {
    user.preferences.authors.forEach(author => userAuthors.add(author));
  }

  // Get books already viewed or in wishlist
  const viewedBooks = user.viewedBooks.map(entry => entry.book?._id?.toString()).filter(Boolean);
  const wishlistBooks = user.wishlist.map(book => book._id?.toString()).filter(Boolean);
  const excludeBooks = [...viewedBooks, ...wishlistBooks];

  // Genre-based recommendations
  if (userGenres.size > 0) {
    const genreBooks = await Book.find({
      _id: { $nin: excludeBooks },
      isActive: true,
      genre: { $in: Array.from(userGenres) },
      'ratings.average': { $gte: 4.0 },
    })
    .sort({ 'ratings.average': -1, 'ratings.count': -1 })
    .limit(5);

    genreBooks.forEach(book => {
      book.recommendationReason = `Based on your interest in ${book.genre.join(', ')}`;
      recommendations.push(book);
    });
  }

  // Author-based recommendations
  if (userAuthors.size > 0) {
    const authorBooks = await Book.find({
      _id: { $nin: excludeBooks },
      isActive: true,
      author: { $in: Array.from(userAuthors) },
    })
    .sort({ publishedDate: -1 })
    .limit(3);

    authorBooks.forEach(book => {
      book.recommendationReason = `New book by ${book.author}, an author you've enjoyed`;
      recommendations.push(book);
    });
  }

  // Popular books (fallback)
  if (recommendations.length < 8) {
    const popularBooks = await Book.find({
      _id: { $nin: [...excludeBooks, ...recommendations.map(r => r._id)] },
      isActive: true,
      'ratings.average': { $gte: 4.0 },
      'ratings.count': { $gte: 10 },
    })
    .sort({ 'ratings.average': -1, 'inventory.sold': -1 })
    .limit(8 - recommendations.length);

    popularBooks.forEach(book => {
      book.recommendationReason = 'Popular among readers with similar tastes';
      recommendations.push(book);
    });
  }

  return recommendations.slice(0, 8);
}

module.exports = router;