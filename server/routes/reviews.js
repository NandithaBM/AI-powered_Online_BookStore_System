import express from 'express';
import { auth } from '../middleware/auth.js';
import Review from '../models/Review.js';
import sentiment from '../services/sentimentAnalysis.js';

const router = express.Router();

// POST: Create a new review with sentiment analysis
router.post('/', auth, async (req, res) => {
  try {
    const { bookId, text, rating } = req.body;

    if (!bookId || !text || !rating) {
      return res.status(400).json({ error: 'bookId, text, and rating are required' });
    }

    // Run sentiment analysis on review text
    const analysis = sentiment.analyze(text);

    const review = new Review({
      user: req.user.id,
      book: bookId,
      text,
      rating,
      sentiment: analysis.overall,
      metadata: analysis
    });

    await review.save();

    res.json({ message: 'Review submitted', review });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// Get reviews for a specific book
router.get('/books/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ book: id }).populate('user', 'name profile');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

export default router;
