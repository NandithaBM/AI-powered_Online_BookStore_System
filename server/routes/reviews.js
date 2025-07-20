const express = require('express');
const { auth } = require('../middleware/auth');
const Review = require('../models/Review');
const sentiment = require('../services/sentimentAnalysis');
const remoteSentiment = require('../services/remoteSentimentAnalysis');

const router = express.Router();

// POST: Create a new review with sentiment analysis
router.post('/', auth, async (req, res) => {
  try {
    const { bookId, text: rawText, comment, rating } = req.body;
    const text = rawText || comment;

    if (!bookId || !text || !rating) {
      return res.status(400).json({ error: 'bookId, text, and rating are required' });
    }

    // Run sentiment analysis on review text (remote)
    const analysis = await remoteSentiment.analyze(text);

    const review = new Review({
      user: req.user.id,
      book: bookId,
      text,
      rating,
      sentiment: analysis.overall,
      metadata: analysis.metadata || analysis
    });

    await review.save();

    res.json({ message: 'Review submitted', review });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// PUT: Update a review and re-analyze sentiment
router.put('/:id', auth, async (req, res) => {
  try {
    const { text, rating } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }
    if (text) review.text = text;
    if (rating) review.rating = rating;
    // Re-analyze sentiment
    const analysis = await remoteSentiment.analyze(review.text);
    review.sentiment = analysis.overall;
    review.metadata = analysis.metadata || analysis;
    await review.save();
    res.json({ message: 'Review updated', review });
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Failed to update review' });
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

module.exports = router;
