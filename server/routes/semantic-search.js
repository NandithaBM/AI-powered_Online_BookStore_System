const express = require('express');
const axios = require('axios');
const router = express.Router();
// ... your require statements for services/models ...

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

module.exports = router; 