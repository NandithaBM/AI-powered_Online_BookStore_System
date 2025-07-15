// VADER-style sentiment using 'sentiment' package
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

module.exports = {
  analyze(text) {
    const result = sentiment.analyze(text);
    return {
      score: result.score,
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative,
      overall: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral',
    };
  }
};
