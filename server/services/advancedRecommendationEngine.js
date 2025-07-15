// Advanced AI Recommendation Engine with Collaborative Filtering
const User = require('../models/User');
const Book = require('../models/Book');
const Order = require('../models/Order');
const sentiment = require('sentiment');
const { Matrix } = require('ml-matrix');

class AdvancedRecommendationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.bookFeatures = new Map();
    this.userItemMatrix = null;
    this.itemSimilarityMatrix = null;
    this.sentimentAnalyzer = sentiment;
  }

  // Generate personalized recommendations with multiple algorithms
  async generateRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId).populate('wishlist');
      if (!user) return [];

      console.log(`Generating recommendations for user ${userId}`);

      // Build user profile with sentiment analysis
      const userProfile = await this.buildAdvancedUserProfile(userId);
      
      // Get books excluding user's purchases and wishlist
      const books = await Book.find({ stock: { $gt: 0 } });
      const excludedBooks = await this.getUserExcludedBooks(user);
      
      const recommendations = [];

      // Generate recommendations using multiple approaches
      const contentBasedRecs = await this.getContentBasedRecommendations(userProfile, books, excludedBooks);
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId, books, excludedBooks);
      const trendingRecs = await this.getTrendingRecommendations(books, excludedBooks);
      const behaviorRecs = await this.getBehaviorBasedRecommendations(userProfile, books, excludedBooks);

      // Combine and weight different recommendation types
      const combinedScores = new Map();

      // Weight the different recommendation sources
      const weights = {
        contentBased: 0.4,
        collaborative: 0.3,
        trending: 0.1,
        behavioral: 0.2
      };

      // Combine scores from all approaches
      this.combineRecommendations(combinedScores, contentBasedRecs, weights.contentBased);
      this.combineRecommendations(combinedScores, collaborativeRecs, weights.collaborative);
      this.combineRecommendations(combinedScores, trendingRecs, weights.trending);
      this.combineRecommendations(combinedScores, behaviorRecs, weights.behavioral);

      // Convert to final recommendations with explanations
      for (const [bookId, score] of combinedScores) {
        const book = books.find(b => b._id.toString() === bookId);
        if (!book || score.total < 0.2) continue;

        const explanation = this.generateAdvancedExplanation(userProfile, book, score);
        
        recommendations.push({
          book: book,
          score: score.total,
          explanation: explanation.text,
          confidence: explanation.confidence,
          reasons: score.breakdown,
          recommendationType: explanation.primaryType
        });
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Advanced recommendation generation error:', error);
      return [];
    }
  }

  // Build comprehensive user profile with sentiment analysis
  async buildAdvancedUserProfile(userId) {
    const orders = await Order.find({ user: userId }).populate('items.book');
    const user = await User.findById(userId);

    const profile = {
      genres: {},
      authors: {},
      priceRange: { min: 0, max: 1000, avg: 0 },
      ratings: {},
      recentActivity: [],
      sentiment: { overall: 0, byGenre: {}, byAuthor: {} },
      readingVelocity: 0,
      diversityScore: 0,
      preferredFeatures: {},
      seasonalPatterns: {}
    };

    let totalSpent = 0;
    let totalBooks = 0;
    const genreSet = new Set();
    const authorSet = new Set();

    // Analyze purchase history with sentiment
    orders.forEach(order => {
      const orderMonth = new Date(order.createdAt).getMonth();
      
      order.items.forEach(item => {
        const book = item.book;
        if (!book) return;

        totalBooks++;
        totalSpent += item.price;

        // Genre analysis
        if (book.genre) {
          profile.genres[book.genre] = (profile.genres[book.genre] || 0) + 1;
          genreSet.add(book.genre);
          
          // Seasonal patterns
          if (!profile.seasonalPatterns[orderMonth]) {
            profile.seasonalPatterns[orderMonth] = {};
          }
          profile.seasonalPatterns[orderMonth][book.genre] = 
            (profile.seasonalPatterns[orderMonth][book.genre] || 0) + 1;
        }

        // Author analysis
        if (book.author) {
          profile.authors[book.author] = (profile.authors[book.author] || 0) + 1;
          authorSet.add(book.author);
        }

        // Price analysis
        if (book.price) {
          profile.priceRange.min = Math.min(profile.priceRange.min || book.price, book.price);
          profile.priceRange.max = Math.max(profile.priceRange.max, book.price);
        }

        // Sentiment analysis on book description/reviews
        if (book.description) {
          const sentimentScore = this.sentimentAnalyzer.analyze(book.description).score;
          
          if (book.genre) {
            if (!profile.sentiment.byGenre[book.genre]) {
              profile.sentiment.byGenre[book.genre] = [];
            }
            profile.sentiment.byGenre[book.genre].push(sentimentScore);
          }
          
          if (book.author) {
            if (!profile.sentiment.byAuthor[book.author]) {
              profile.sentiment.byAuthor[book.author] = [];
            }
            profile.sentiment.byAuthor[book.author].push(sentimentScore);
          }
        }

        // Feature preferences (length, complexity, etc.)
        if (book.pages) {
          if (!profile.preferredFeatures.pageLength) {
            profile.preferredFeatures.pageLength = [];
          }
          profile.preferredFeatures.pageLength.push(book.pages);
        }

        profile.recentActivity.push({
          action: 'purchase',
          book: book,
          date: order.createdAt,
          price: item.price
        });
      });
    });

    // Calculate derived metrics
    if (totalBooks > 0) {
      profile.priceRange.avg = totalSpent / totalBooks;
      profile.diversityScore = (genreSet.size + authorSet.size) / (totalBooks * 2);
      profile.readingVelocity = this.calculateReadingVelocity(orders);
    }

    // Calculate average sentiment scores
    profile.sentiment.overall = this.calculateAverageSentiment(profile.sentiment);

    // Normalize preferences
    profile.topGenres = Object.entries(profile.genres)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, score: count / totalBooks }));

    profile.topAuthors = Object.entries(profile.authors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([author, count]) => ({ author, score: count / totalBooks }));

    return profile;
  }

  // Content-based recommendations
  async getContentBasedRecommendations(userProfile, books, excludedBooks) {
    const recommendations = [];

    books.forEach(book => {
      if (excludedBooks.has(book._id.toString())) return;

      let score = 0;
      const breakdown = {};

      // Genre matching with sentiment
      if (book.genre && userProfile.genres[book.genre]) {
        const genreScore = userProfile.genres[book.genre] / Math.max(...Object.values(userProfile.genres));
        const sentimentBonus = this.getSentimentBonus(book, userProfile.sentiment.byGenre[book.genre]);
        score += (genreScore * 0.3) + sentimentBonus;
        breakdown.genre = genreScore;
      }

      // Author matching
      if (book.author && userProfile.authors[book.author]) {
        const authorScore = userProfile.authors[book.author] / Math.max(...Object.values(userProfile.authors));
        score += authorScore * 0.25;
        breakdown.author = authorScore;
      }

      // Price preference
      if (book.price && userProfile.priceRange.avg > 0) {
        const priceDiff = Math.abs(book.price - userProfile.priceRange.avg);
        const priceScore = Math.max(0, 1 - (priceDiff / userProfile.priceRange.avg));
        score += priceScore * 0.15;
        breakdown.price = priceScore;
      }

      // Rating quality
      if (book.rating && book.rating > 4) {
        const ratingScore = (book.rating - 3) / 2;
        score += ratingScore * 0.15;
        breakdown.rating = ratingScore;
      }

      // Diversity bonus for exploring new genres/authors
      if (!userProfile.genres[book.genre] || !userProfile.authors[book.author]) {
        score += userProfile.diversityScore * 0.1;
        breakdown.diversity = userProfile.diversityScore;
      }

      if (score > 0) {
        recommendations.push({ bookId: book._id.toString(), score, breakdown });
      }
    });

    return recommendations;
  }

  // Collaborative filtering recommendations
  async getCollaborativeRecommendations(userId, books, excludedBooks) {
    try {
      // Build user-item interaction matrix
      await this.buildUserItemMatrix();
      
      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId);
      
      const recommendations = [];
      const bookScores = new Map();

      // Get books liked by similar users
      for (const { userId: similarUserId, similarity } of similarUsers) {
        const userOrders = await Order.find({ user: similarUserId }).populate('items.book');
        
        userOrders.forEach(order => {
          order.items.forEach(item => {
            const book = item.book;
            if (!book || excludedBooks.has(book._id.toString())) return;

            const currentScore = bookScores.get(book._id.toString()) || 0;
            bookScores.set(book._id.toString(), currentScore + similarity);
          });
        });
      }

      // Convert to recommendations
      for (const [bookId, score] of bookScores) {
        recommendations.push({ 
          bookId, 
          score: score / similarUsers.length,
          breakdown: { collaborative: score }
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  // Trending recommendations based on recent popularity
  async getTrendingRecommendations(books, excludedBooks) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      const recentOrders = await Order.find({ 
        createdAt: { $gte: thirtyDaysAgo },
        status: 'completed'
      }).populate('items.book');

      const trendingScores = new Map();

      recentOrders.forEach(order => {
        order.items.forEach(item => {
          const book = item.book;
          if (!book || excludedBooks.has(book._id.toString())) return;

          const daysSinceOrder = (Date.now() - order.createdAt) / (1000 * 60 * 60 * 24);
          const decayFactor = Math.exp(-daysSinceOrder / 10); // Exponential decay
          
          const currentScore = trendingScores.get(book._id.toString()) || 0;
          trendingScores.set(book._id.toString(), currentScore + decayFactor);
        });
      });

      const recommendations = [];
      for (const [bookId, score] of trendingScores) {
        recommendations.push({ 
          bookId, 
          score: score / 10, // Normalize
          breakdown: { trending: score }
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Trending recommendations error:', error);
      return [];
    }
  }

  // Behavior-based recommendations
  async getBehaviorBasedRecommendations(userProfile, books, excludedBooks) {
    const recommendations = [];
    const currentMonth = new Date().getMonth();

    books.forEach(book => {
      if (excludedBooks.has(book._id.toString())) return;

      let score = 0;
      const breakdown = {};

      // Seasonal pattern matching
      if (book.genre && userProfile.seasonalPatterns[currentMonth]) {
        const seasonalScore = userProfile.seasonalPatterns[currentMonth][book.genre] || 0;
        score += seasonalScore * 0.2;
        breakdown.seasonal = seasonalScore;
      }

      // Reading velocity matching (suggest shorter books for fast readers)
      if (book.pages && userProfile.readingVelocity > 0) {
        const velocityScore = userProfile.readingVelocity > 2 ? 
          Math.max(0, 1 - (book.pages / 500)) : // Fast readers prefer shorter books
          Math.min(1, book.pages / 300); // Slow readers prefer longer books
        score += velocityScore * 0.15;
        breakdown.velocity = velocityScore;
      }

      if (score > 0) {
        recommendations.push({ bookId: book._id.toString(), score, breakdown });
      }
    });

    return recommendations;
  }

  // Helper methods
  combineRecommendations(combinedScores, recommendations, weight) {
    recommendations.forEach(rec => {
      const existing = combinedScores.get(rec.bookId) || { total: 0, breakdown: {} };
      existing.total += rec.score * weight;
      
      // Merge breakdowns
      Object.keys(rec.breakdown).forEach(key => {
        existing.breakdown[key] = (existing.breakdown[key] || 0) + rec.breakdown[key] * weight;
      });
      
      combinedScores.set(rec.bookId, existing);
    });
  }

  async getUserExcludedBooks(user) {
    const excluded = new Set();
    
    // Add wishlist books
    if (user.wishlist) {
      user.wishlist.forEach(book => excluded.add(book._id.toString()));
    }
    
    // Add purchased books
    const userOrders = await Order.find({ user: user._id }).populate('items.book');
    userOrders.forEach(order => {
      order.items.forEach(item => {
        if (item.book) excluded.add(item.book._id.toString());
      });
    });
    
    return excluded;
  }

  getSentimentBonus(book, sentimentHistory) {
    if (!sentimentHistory || sentimentHistory.length === 0) return 0;
    
    const avgSentiment = sentimentHistory.reduce((a, b) => a + b, 0) / sentimentHistory.length;
    const bookSentiment = this.sentimentAnalyzer.analyze(book.description || '').score;
    
    // Bonus for matching sentiment preference
    const sentimentMatch = 1 - Math.abs(avgSentiment - bookSentiment) / 10;
    return Math.max(0, sentimentMatch * 0.1);
  }

  calculateReadingVelocity(orders) {
    if (orders.length < 2) return 1;
    
    const timeSpan = (orders[orders.length - 1].createdAt - orders[0].createdAt) / (1000 * 60 * 60 * 24);
    const totalBooks = orders.reduce((sum, order) => sum + order.items.length, 0);
    
    return timeSpan > 0 ? totalBooks / (timeSpan / 30) : 1; // Books per month
  }

  calculateAverageSentiment(sentimentData) {
    const allScores = [];
    
    Object.values(sentimentData.byGenre).forEach(scores => {
      allScores.push(...scores);
    });
    
    Object.values(sentimentData.byAuthor).forEach(scores => {
      allScores.push(...scores);
    });
    
    return allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  }

  generateAdvancedExplanation(userProfile, book, score) {
    const reasons = [];
    let confidence = 0.5;
    let primaryType = 'general';

    // Analyze the strongest recommendation factors
    const breakdown = score.breakdown;
    const maxScore = Math.max(...Object.values(breakdown));

    if (breakdown.genre && breakdown.genre === maxScore) {
      const genreCount = userProfile.genres[book.genre] || 0;
      reasons.push(`you've enjoyed ${genreCount} ${book.genre} book${genreCount > 1 ? 's' : ''}`);
      confidence += 0.2;
      primaryType = 'content-based';
    }

    if (breakdown.author && breakdown.author === maxScore) {
      const authorCount = userProfile.authors[book.author] || 0;
      reasons.push(`you're a fan of ${book.author} (${authorCount} previous books)`);
      confidence += 0.3;
      primaryType = 'content-based';
    }

    if (breakdown.collaborative && breakdown.collaborative === maxScore) {
      reasons.push(`users with similar taste have loved this book`);
      confidence += 0.25;
      primaryType = 'collaborative';
    }

    if (breakdown.trending && breakdown.trending === maxScore) {
      reasons.push(`it's currently trending among our readers`);
      confidence += 0.1;
      primaryType = 'trending';
    }

    if (breakdown.seasonal) {
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      reasons.push(`it matches your ${currentMonth} reading preferences`);
      confidence += 0.1;
      primaryType = 'behavioral';
    }

    if (book.rating && book.rating > 4.5) {
      reasons.push(`it has exceptional ratings (${book.rating.toFixed(1)} stars)`);
      confidence += 0.1;
    }

    if (reasons.length === 0) {
      return {
        text: "Recommended based on your reading patterns and preferences",
        confidence: 0.3,
        primaryType: 'general'
      };
    }

    let text;
    if (reasons.length === 1) {
      text = `Recommended because ${reasons[0]}.`;
    } else {
      const lastReason = reasons.pop();
      text = `Recommended because ${reasons.join(', ')} and ${lastReason}.`;
    }

    return {
      text,
      confidence: Math.min(confidence, 1.0),
      primaryType
    };
  }

  // Placeholder methods for collaborative filtering
  async buildUserItemMatrix() {
    // In production, implement proper matrix building
    return true;
  }

  async findSimilarUsers(userId, limit = 10) {
    // In production, implement user similarity calculation
    // For now, return empty array
    return [];
  }

  // Track user interaction for learning
  async trackInteraction(userId, bookId, action, metadata = {}) {
    try {
      const interaction = {
        userId,
        bookId,
        action,
        metadata: {
          ...metadata,
          timestamp: new Date(),
          sessionId: metadata.sessionId || 'unknown'
        }
      };

      // Store interaction for ML training
      console.log('Advanced interaction tracked:', interaction);
      
      // Update user profile cache if needed
      if (['purchase', 'wishlist', 'rate'].includes(action)) {
        this.userProfiles.delete(userId);
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
}

module.exports = new AdvancedRecommendationEngine();