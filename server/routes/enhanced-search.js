const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const enhancedSemanticSearch = require('../services/enhancedSemanticSearch');
const advancedRecommendationEngine = require('../services/advancedRecommendationEngine');

// Enhanced semantic search endpoint
router.get('/semantic', async (req, res) => {
  try {
    const { query, limit = 10, includeExplanations = false } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = enhancedSemanticSearch.search(query, parseInt(limit), {
      includeScoreBreakdown: includeExplanations
    });
    
    // Track search for analytics and learning
    if (req.user) {
      advancedRecommendationEngine.trackInteraction(
        req.user.id, 
        null, 
        'search', 
        { 
          query, 
          resultsCount: results.length,
          timestamp: new Date(),
          sessionId: req.headers['x-session-id']
        }
      );
    }

    res.json({
      query,
      results,
      totalFound: results.length,
      searchMetadata: {
        processingTime: Date.now() - req.startTime,
        algorithm: 'enhanced-semantic',
        confidence: results.length > 0 ? results[0].relevanceScore : 0
      }
    });
  } catch (error) {
    console.error('Enhanced semantic search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Intelligent search suggestions with context
router.get('/suggestions', async (req, res) => {
  try {
    const { q, context } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = enhancedSemanticSearch.getSuggestions(q);
    
    // Enhance suggestions with context if user is logged in
    if (req.user && context === 'personalized') {
      // Add personalized suggestions based on user's reading history
      // This would integrate with the recommendation engine
    }

    res.json({ 
      suggestions,
      context: context || 'general'
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Advanced search with AI-powered filters and ranking
router.post('/advanced', async (req, res) => {
  try {
    const {
      query,
      filters = {},
      sortBy = 'relevance',
      limit = 20,
      includeRecommendations = false
    } = req.body;

    let searchResults = [];

    if (query) {
      searchResults = enhancedSemanticSearch.search(query, limit * 2, {
        filters,
        sortBy
      });
    } else {
      // If no query, get filtered results
      const books = await Book.find(this.buildMongoFilter(filters));
      searchResults = books.map(book => ({ ...book._doc, relevanceScore: 0 }));
    }

    // Apply additional filters and sorting
    let filteredResults = this.applyAdvancedFilters(searchResults, filters);
    filteredResults = this.applySorting(filteredResults, sortBy);

    const results = filteredResults.slice(0, limit);

    // Include AI recommendations if requested
    let recommendations = [];
    if (includeRecommendations && req.user) {
      try {
        const recs = await advancedRecommendationEngine.generateRecommendations(req.user.id, 5);
        recommendations = recs.map(r => ({
          ...r.book._doc || r.book,
          isRecommendation: true,
          recommendationScore: r.score,
          explanation: r.explanation
        }));
      } catch (recError) {
        console.error('Recommendation error in search:', recError);
      }
    }

    res.json({
      results,
      recommendations,
      totalFound: filteredResults.length,
      appliedFilters: filters,
      searchMetadata: {
        algorithm: 'advanced-ai',
        hasRecommendations: recommendations.length > 0,
        processingTime: Date.now() - req.startTime
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// Search analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // This would collect search analytics from your analytics service
    const analytics = {
      totalSearches: 1250,
      topQueries: [
        { query: 'science fiction', count: 156, avgResults: 23 },
        { query: 'mystery thriller', count: 134, avgResults: 18 },
        { query: 'romance novels', count: 121, avgResults: 31 }
      ],
      searchSuccess: {
        withResults: 89.2,
        withClicks: 67.8,
        withPurchases: 23.4
      },
      avgResponseTime: 145 // milliseconds
    };

    res.json({
      timeframe,
      analytics,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({ error: 'Failed to get search analytics' });
  }
});

// Helper methods
function buildMongoFilter(filters) {
  const mongoFilter = {};
  
  if (filters.genre) {
    mongoFilter.genre = new RegExp(filters.genre, 'i');
  }
  
  if (filters.author) {
    mongoFilter.author = new RegExp(filters.author, 'i');
  }
  
  if (filters.priceRange) {
    mongoFilter.price = {
      $gte: filters.priceRange.min || 0,
      $lte: filters.priceRange.max || 1000
    };
  }
  
  if (filters.rating) {
    mongoFilter.rating = { $gte: filters.rating };
  }
  
  if (filters.inStock) {
    mongoFilter.stock = { $gt: 0 };
  }
  
  return mongoFilter;
}

function applyAdvancedFilters(results, filters) {
  let filtered = results;
  
  if (filters.genre) {
    filtered = filtered.filter(book => 
      book.genre && book.genre.toLowerCase().includes(filters.genre.toLowerCase())
    );
  }
  
  if (filters.author) {
    filtered = filtered.filter(book => 
      book.author && book.author.toLowerCase().includes(filters.author.toLowerCase())
    );
  }
  
  if (filters.priceRange) {
    const { min = 0, max = 1000 } = filters.priceRange;
    filtered = filtered.filter(book => 
      book.price >= min && book.price <= max
    );
  }
  
  if (filters.rating) {
    filtered = filtered.filter(book => 
      book.rating && book.rating >= filters.rating
    );
  }
  
  if (filters.inStock) {
    filtered = filtered.filter(book => 
      book.stock && book.stock > 0
    );
  }
  
  return filtered;
}

function applySorting(results, sortBy) {
  switch (sortBy) {
    case 'price-low':
      return results.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'price-high':
      return results.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'rating':
      return results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'newest':
      return results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    case 'popularity':
      return results.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    case 'relevance':
    default:
      return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }
}

// Re-index search with enhanced features
router.post('/reindex', async (req, res) => {
  try {
    const books = await Book.find({});
    await enhancedSemanticSearch.initializeIndex(books);
    
    res.json({ 
      message: 'Enhanced search index rebuilt successfully',
      booksIndexed: books.length,
      features: [
        'Multi-field semantic search',
        'Word vector similarity',
        'Advanced NLP processing',
        'Contextual ranking'
      ]
    });
  } catch (error) {
    console.error('Enhanced reindex error:', error);
    res.status(500).json({ error: 'Failed to rebuild enhanced search index' });
  }
});

module.exports = router;