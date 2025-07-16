const mongoose = require('mongoose');
const Review = require('../models/Review');
const remoteSentiment = require('../services/remoteSentimentAnalysis');
require('dotenv').config({ path: '../.env' });

async function updateAllReviewSentiments() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/books', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const reviews = await Review.find({});
  let updated = 0, failed = 0;

  for (const review of reviews) {
    try {
      const analysis = await remoteSentiment.analyze(review.text);
      review.sentiment = analysis.overall;
      review.metadata = analysis.metadata || analysis;
      await review.save();
      updated++;
      console.log(`Updated review ${review._id} (user: ${review.user})`);
    } catch (err) {
      failed++;
      console.error(`Failed to update review ${review._id}:`, err.message);
    }
  }

  console.log(`\nBatch sentiment update complete. Updated: ${updated}, Failed: ${failed}`);
  await mongoose.disconnect();
}

updateAllReviewSentiments(); 