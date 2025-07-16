const axios = require('axios');

const PYTHON_SENTIMENT_URL = process.env.PYTHON_SENTIMENT_URL || 'http://localhost:8000/sentiment';

module.exports = {
  async analyze(text) {
    try {
      const response = await axios.post(PYTHON_SENTIMENT_URL, { text });
      // Expecting: { score, label, positive, negative, neutral, ... }
      const data = response.data;
      return {
        score: data.score,
        positive: data.positive,
        negative: data.negative,
        neutral: data.neutral,
        overall: data.label || (data.score > 0 ? 'positive' : data.score < 0 ? 'negative' : 'neutral'),
        metadata: data
      };
    } catch (error) {
      console.error('Remote sentiment analysis failed:', error.message);
      // Fallback: neutral
      return {
        score: 0,
        positive: 0,
        negative: 0,
        neutral: 1,
        overall: 'neutral',
        metadata: { error: 'Remote sentiment analysis failed' }
      };
    }
  }
}; 