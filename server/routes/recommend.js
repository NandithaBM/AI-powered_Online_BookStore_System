import express from 'express';
import axios from 'axios';
import Book from '../models/Book.js';
const router = express.Router();

// Proxy GET /api/recommend?book_id=...&limit=...
router.get('/', async (req, res) => {
  try {
    const { book_id, limit } = req.query;
    const response = await axios.get('http://localhost:8000/recommend', {
      params: { book_id, limit }
    });
    let recommendations = response.data;
    // If the response is an object with a 'results' or 'recommendations' array, use that
    if (recommendations && (recommendations.results || recommendations.recommendations)) {
      recommendations = recommendations.results || recommendations.recommendations;
    }
    // Filter out books that do not exist in the database
    const ids = recommendations.map(b => b._id || b.id).filter(Boolean);
    console.log('Recommended IDs from Python service:', ids);
    const existingBooks = await Book.find({ _id: { $in: ids } });
    const existingIds = new Set(existingBooks.map(b => b._id.toString()));
    console.log('Existing IDs in MongoDB:', Array.from(existingIds));
    const filtered = recommendations.filter(b => existingIds.has((b._id || b.id || '').toString()));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Recommendation failed', details: err.message });
  }
});

export default router; 