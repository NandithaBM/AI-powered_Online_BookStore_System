const express = require('express');
const axios = require('axios');
const router = express.Router();

// Proxy POST /api/sentiment
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    const response = await axios.post('http://localhost:8000/sentiment', { text });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Sentiment analysis failed', details: err.message });
  }
});

module.exports = router;  