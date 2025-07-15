import express from 'express';
import Book from '../models/Book.js';
import { auth } from '../middleware/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get all books with filters and search
router.get('/', async (req, res) => {
  try {
    const {
      search,
      genre,
      author,
      minPrice,
      maxPrice,
      minRating,
      format,
      language,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }

    if (genre) {
      filter.genre = { $in: Array.isArray(genre) ? genre : [genre] };
    }

    if (author) {
      filter.author = new RegExp(author, 'i');
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    if (minRating) {
      filter['ratings.average'] = { $gte: parseFloat(minRating) };
    }

    if (format) {
      filter.format = { $in: Array.isArray(format) ? format : [format] };
    }

    if (language) {
      filter.language = language;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const books = await Book.find(filter)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('similarBooks', 'title author coverImage price ratings');

    const total = await Book.countDocuments(filter);

    res.json({
      books,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured books
router.get('/featured', async (req, res) => {
  try {
    const books = await Book.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .sort({ 'ratings.average': -1 })
    .limit(8);

    res.json(books);
  } catch (error) {
    console.error('Get featured books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get new releases
router.get('/new-releases', async (req, res) => {
  try {
    const books = await Book.find({ 
      isActive: true, 
      isNewRelease: true 
    })
    .sort({ publishedDate: -1 })
    .limit(8);

    res.json(books);
  } catch (error) {
    console.error('Get new releases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bestsellers
router.get('/bestsellers', async (req, res) => {
  try {
    const books = await Book.find({ 
      isActive: true, 
      isBestseller: true 
    })
    .sort({ 'inventory.sold': -1 })
    .limit(8);

    res.json(books);
  } catch (error) {
    console.error('Get bestsellers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book by ID (public route)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const book = await Book.findById(id);
    if (!book) {
      console.log('Book not found:', id);
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user already reviewed this book
    const existingReview = book.reviews.find(
      review => review.user.toString() === req.user.userId
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this book' });
    }

    // Add review
    book.reviews.push({
      user: req.user.userId,
      rating,
      comment,
      sentiment: 'neutral', // This would be determined by AI sentiment analysis
    });

    // Update ratings
    book.updateRatings();
    await book.save();

    await book.populate('reviews.user', 'name profile.avatar');

    res.status(201).json({
      message: 'Review added successfully',
      review: book.reviews[book.reviews.length - 1],
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get related books (by genre, author, and customers also bought)
router.get('/:id/related', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Find books with same genre or author
    const genreBooks = await Book.find({
      _id: { $ne: book._id },
      isActive: true,
      genre: { $in: Array.isArray(book.genre) ? book.genre : [book.genre] },
    }).limit(8);

    const authorBooks = await Book.find({
      _id: { $ne: book._id },
      isActive: true,
      author: book.author,
    }).limit(8);

    // Customers also bought logic
    // Find orders containing this book
    const orders = await Order.find({ 'items.book': book._id }).select('items').lean();
    const alsoBoughtBookIds = new Set();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.book.toString() !== book._id.toString()) {
          alsoBoughtBookIds.add(item.book.toString());
        }
      });
    });
    let alsoBoughtBooks = [];
    if (alsoBoughtBookIds.size > 0) {
      alsoBoughtBooks = await Book.find({
        _id: { $in: Array.from(alsoBoughtBookIds) },
        isActive: true,
      }).limit(8);
    }

    // Merge and deduplicate results, prioritize also bought, then genre, then author
    const seen = new Set();
    const related = [];
    for (const b of [...alsoBoughtBooks, ...genreBooks, ...authorBooks]) {
      if (!seen.has(b._id.toString())) {
        related.push(b);
        seen.add(b._id.toString());
      }
      if (related.length >= 12) break;
    }

    res.json(related);
  } catch (err) {
    console.error('Error fetching related books:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get genres
router.get('/meta/genres', async (req, res) => {
  try {
    const genres = await Book.distinct('genre', { isActive: true });
    res.json(genres);
  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get authors
router.get('/meta/authors', async (req, res) => {
  try {
    const authors = await Book.distinct('author', { isActive: true });
    res.json(authors);
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;