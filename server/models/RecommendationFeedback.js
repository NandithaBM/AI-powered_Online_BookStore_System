const mongoose = require('mongoose');

const recommendationFeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  feedback: { type: String, enum: ['up', 'down'], required: true }, // or use Number for 1-5 stars
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema); 