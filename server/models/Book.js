const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  genre: [{
    type: String,
    required: true,
  }],
  subGenres: [String],
  language: {
    type: String,
    default: 'English',
  },
  publisher: {
    type: String,
    required: true,
  },
  publishedDate: {
    type: Date,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
    min: 1,
  },
  format: {
    type: String,
    enum: ['hardcover', 'paperback', 'ebook', 'audiobook'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  coverImage: {
    type: String,
    required: true,
  },
  images: [String],
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    reserved: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
  },
  reviews: [reviewSchema],
  tags: [String],
  series: {
    name: String,
    number: Number,
  },
  awards: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isNewRelease: {
    type: Boolean,
    default: false,
  },
  isBestseller: {
    type: Boolean,
    default: false,
  },
  similarBooks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  }],
  metadata: {
    keywords: [String],
    readingLevel: String,
    ageGroup: String,
    themes: [String],
  },
}, {
  timestamps: true,
});

bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ 'ratings.average': -1 });
bookSchema.index({ publishedDate: -1 });
bookSchema.index({ isFeatured: 1 });
bookSchema.index({ isNewRelease: 1 });
bookSchema.index({ isBestseller: 1 });

bookSchema.methods.updateRatings = function() {
  const reviews = this.reviews;
  const count = reviews.length;
  if (count === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
    return;
  }
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  this.ratings.average = Math.round((sum / count) * 10) / 10;
  this.ratings.count = count;
  this.ratings.distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(review => {
    this.ratings.distribution[review.rating]++;
  });
};

bookSchema.methods.aggregateSentiment = function() {
  const reviews = this.reviews || [];
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let sentimentScoreSum = 0;
  let sentimentScoreCount = 0;
  reviews.forEach(review => {
    if (review.sentiment && sentimentCounts.hasOwnProperty(review.sentiment)) {
      sentimentCounts[review.sentiment]++;
    }
    if (review.metadata && typeof review.metadata.score === 'number') {
      sentimentScoreSum += review.metadata.score;
      sentimentScoreCount++;
    }
  });
  const averageScore = sentimentScoreCount > 0 ? (sentimentScoreSum / sentimentScoreCount) : null;
  this.sentimentSummary = {
    ...sentimentCounts,
    total: reviews.length,
    averageScore
  };
  return this.sentimentSummary;
};

module.exports = mongoose.model('Book', bookSchema);