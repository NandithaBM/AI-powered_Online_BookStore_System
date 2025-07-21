const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const recommendationEngine = require('../services/recommendationEngine');
const RecommendationFeedback = require('../models/RecommendationFeedback');

const router = express.Router();

// Get personalized recommendations (simplified version for home page)
router.get('/personalized', auth, async (req, res) => {
  try {
    const recommendations = await recommendationEngine.generateRecommendations(req.user.id, 8);
    const simplifiedBooks = recommendations.map(r => r.book);
    res.json({ recommendations: simplifiedBooks });
  } catch (err) {
    console.error('Personalized recommendation error:', err);
    res.status(500).json({ error: 'Failed to fetch personalized books' });
  }
});

// Get personalized recommendations with explanation
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    const recommendations = await recommendationEngine.generateRecommendations(
      userId, 
      parseInt(limit)
    );

    res.json({
      recommendations,
      userId,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Track user interaction
router.post('/track', auth, async (req, res) => {
  try {
    const { bookId, action, metadata = {} } = req.body;
    const userId = req.user.id;

    await recommendationEngine.trackInteraction(userId, bookId, action, metadata);

    res.json({ message: 'Interaction tracked successfully' });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// POST: User feedback on recommendation explanations
router.post('/feedback', auth, async (req, res) => {
  try {
    const { bookId, feedback, comment } = req.body;
    const userId = req.user.id;
    if (!bookId || typeof feedback === 'undefined') {
      return res.status(400).json({ error: 'bookId and feedback are required' });
    }
    const fb = new RecommendationFeedback({
      user: userId,
      book: bookId,
      feedback, // e.g., 'up' | 'down' or 1/-1 or 1-5
      comment: comment || ''
    });
    await fb.save();
    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get recommendation explanation
router.get('/explain/:bookId', auth, async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const recommendations = await recommendationEngine.generateRecommendations(userId, 50);
    const recommendation = recommendations.find(r => r.book._id.toString() === bookId);

    if (!recommendation) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({
      book: recommendation.book,
      explanation: recommendation.explanation,
      score: recommendation.score,
      reasons: recommendation.reasons
    });
  } catch (error) {
    console.error('Explanation error:', error);
    res.status(500).json({ error: 'Failed to get explanation' });
  }
});

// Get similar books
router.get('/similar/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { limit = 5 } = req.query;

    const Book = require('../models/Book');
    const targetBook = await Book.findById(bookId);

    if (!targetBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const similarBooks = await Book.find({
      _id: { $ne: bookId },
      $or: [
        { genre: targetBook.genre },
        { author: targetBook.author },
        { tags: { $in: targetBook.tags || [] } }
      ],
      stock: { $gt: 0 }
    }).limit(parseInt(limit));

    res.json({
      targetBook: {
        id: targetBook._id,
        title: targetBook.title,
        author: targetBook.author
      },
      similarBooks
    });
  } catch (error) {
    console.error('Similar books error:', error);
    res.status(500).json({ error: 'Failed to find similar books' });
  }
});

module.exports = router;
