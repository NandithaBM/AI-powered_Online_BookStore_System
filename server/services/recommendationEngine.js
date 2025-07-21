const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');

class RecommendationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.bookFeatures = new Map();
  }

  async generateRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId).populate('wishlist');
      if (!user) return [];

      const userProfile = await this.buildUserProfile(userId);
      const books = await Book.find({ stock: { $gt: 0 } });

      const recommendations = [];

      for (const book of books) {
        if (this.userOwnsBook(user, book._id) || 
            user.wishlist.some(w => w._id.toString() === book._id.toString())) {
          continue;
        }

        const score = await this.calculateRecommendationScore(userProfile, book);
        const explanation = this.generateExplanation(userProfile, book, score);

        // --- BEGIN granular XAI dataPoints ---
        const dataPoints = [];
        if (score.breakdown.genre > 0.1) {
          const genreCount = userProfile.genres[book.genre] || 0;
          dataPoints.push(`You purchased ${genreCount} ${book.genre} book${genreCount > 1 ? 's' : ''}`);
        }
        if (score.breakdown.author > 0.1) {
          const authorCount = userProfile.authors[book.author] || 0;
          dataPoints.push(`You enjoyed ${authorCount} book${authorCount > 1 ? 's' : ''} by ${book.author}`);
        }
        if (score.breakdown.rating > 0.1 && book.rating) {
          dataPoints.push(`This book has a ${book.rating}-star rating`);
        }
        if (score.breakdown.popularity > 0.05) {
          dataPoints.push(`This book is popular with other customers`);
        }
        if (score.breakdown.newness > 0.02) {
          dataPoints.push(`This book is a new release`);
        }
        // Add more granular facts as needed
        // --- END granular XAI dataPoints ---

        if (score.total > 0.3) {
          recommendations.push({
            book,
            score: score.total,
            explanation,
            reasons: score.breakdown,
            dataPoints // <-- new field for granular XAI
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return [];
    }
  }

  async buildUserProfile(userId) {
    const orders = await Order.find({ user: userId }).populate('items.book');
    const user = await User.findById(userId);

    const profile = {
      genres: {},
      authors: {},
      priceRange: { min: 0, max: 1000 },
      ratings: {},
      recentActivity: [],
      sentiment: 'neutral'
    };

    orders.forEach(order => {
      order.items.forEach(item => {
        const book = item.book;
        if (!book) return;

        if (book.genre) {
          profile.genres[book.genre] = (profile.genres[book.genre] || 0) + 1;
        }

        if (book.author) {
          profile.authors[book.author] = (profile.authors[book.author] || 0) + 1;
        }

        if (book.price) {
          profile.priceRange.min = Math.min(profile.priceRange.min, book.price);
          profile.priceRange.max = Math.max(profile.priceRange.max, book.price);
        }

        profile.recentActivity.push({
          action: 'purchase',
          book,
          date: order.createdAt
        });
      });
    });

    if (user.wishlist) {
      user.wishlist.forEach(book => {
        profile.recentActivity.push({
          action: 'wishlist',
          book,
          date: new Date()
        });
      });
    }

    profile.topGenres = Object.entries(profile.genres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre);

    profile.topAuthors = Object.entries(profile.authors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([author]) => author);

    return profile;
  }

  async calculateRecommendationScore(userProfile, book) {
    const scores = {
      genre: 0,
      author: 0,
      price: 0,
      popularity: 0,
      rating: 0,
      newness: 0
    };

    if (book.genre && userProfile.genres[book.genre]) {
      scores.genre = Math.min(userProfile.genres[book.genre] / 5, 1) * 0.3;
    }

    if (book.author && userProfile.authors[book.author]) {
      scores.author = Math.min(userProfile.authors[book.author] / 3, 1) * 0.25;
    }

    if (
      book.price >= userProfile.priceRange.min &&
      book.price <= userProfile.priceRange.max * 1.2
    ) {
      scores.price = 0.15;
    }

    const initialStock = book.initialStock || book.stock + 10;
    const soldCount = initialStock - book.stock;
    scores.popularity = Math.min(soldCount / 20, 1) * 0.1;

    if (book.rating && book.rating > 4) {
      scores.rating = (book.rating - 3) / 2 * 0.15;
    }

    const daysSinceAdded = (Date.now() - book.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded < 30) {
      scores.newness = (30 - daysSinceAdded) / 30 * 0.05;
    }

    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);

    return {
      total,
      breakdown: scores
    };
  }

  generateExplanation(userProfile, book, score) {
    const reasons = [];

    if (score.breakdown.genre > 0.1) {
      const genreCount = userProfile.genres[book.genre] || 0;
      reasons.push(`you've purchased ${genreCount} ${book.genre} book${genreCount > 1 ? 's' : ''}`);
    }

    if (score.breakdown.author > 0.1) {
      const authorCount = userProfile.authors[book.author] || 0;
      reasons.push(`you've enjoyed ${authorCount} book${authorCount > 1 ? 's' : ''} by ${book.author}`);
    }

    if (score.breakdown.rating > 0.1) {
      reasons.push(`it has a ${book.rating}-star rating`);
    }

    if (score.breakdown.popularity > 0.05) {
      reasons.push(`it's popular with other customers`);
    }

    if (score.breakdown.newness > 0.02) {
      reasons.push(`it's a new release`);
    }

    if (reasons.length === 0) {
      return "Recommended based on your browsing patterns";
    }

    if (reasons.length === 1) {
      return `Recommended because ${reasons[0]}.`;
    }

    const lastReason = reasons.pop();
    return `Recommended because ${reasons.join(', ')} and ${lastReason}.`;
  }

  userOwnsBook(user, bookId) {
    return false;
  }

  async trackInteraction(userId, bookId, action, metadata = {}) {
    try {
      const interaction = {
        userId,
        bookId,
        action,
        metadata,
        timestamp: new Date()
      };
      console.log('User interaction tracked:', interaction);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
}

module.exports = new RecommendationEngine();
