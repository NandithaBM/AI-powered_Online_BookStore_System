import express from 'express';
import axios from 'axios';
const router = express.Router();

// Proxy GET /api/recommend?book_id=...&limit=...
router.get('/', async (req, res) => {
  try {
    const { book_id, limit } = req.query;
    const response = await axios.get('http://localhost:8000/recommend', {
      params: { book_id, limit }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Recommendation failed', details: err.message });
  }
});

export default router; 