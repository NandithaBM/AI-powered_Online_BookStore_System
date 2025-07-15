import express from 'express';
import axios from 'axios';
const router = express.Router();

// Proxy GET /api/semantic-search?query=...&limit=...
router.get('/', async (req, res) => {
  try {
    const { query, limit } = req.query;
    const response = await axios.get('http://localhost:8000/semantic-search', {
      params: { query, limit }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Semantic search failed', details: err.message });
  }
});

export default router; 