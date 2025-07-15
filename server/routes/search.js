import express from 'express';
import Book from '../models/Book.js';
import semanticSearch from '../services/semanticSearch.js';
import recommendationEngine from '../services/recommendationEngine.js';
import { spawnSync } from 'child_process';

const router = express.Router();

// Initialize search index (for suggestions and fallback search)
let searchInitialized = false;

async function initializeSearch() {
  if (!searchInitialized) {
    try {
      const books = await Book.find({});
      await semanticSearch.initializeIndex(books);
      searchInitialized = true;
      console.log('Search index initialized with', books.length, 'books');
    } catch (error) {
      console.error('Search initialization error:', error);
    }
  }
}

// Semantic search using Python + SBERT + FAISS
router.get('/semantic', async (req, res) => {
  const { query, limit = 10 } = req.query;

  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    // Step 1: Get embedding from Python
    const embedProc = spawnSync('python', ['semantic-search/query_vector.py', query]);

    if (embedProc.error || !embedProc.stdout) {
      throw new Error('Failed to run query_vector.py');
    }

    const vector = JSON.parse(embedProc.stdout.toString());

    // Step 2: Search FAISS
    const faissProc = spawnSync('python', ['semantic-search/faiss_index.py', limit], {
      input: JSON.stringify(vector),
      encoding: 'utf-8'
    });

    if (faissProc.error || !faissProc.stdout) {
      throw new Error('Failed to run faiss_index.py');
    }

    const results = JSON.parse(faissProc.stdout.toString());

    // Step 3: Track query
    if (req.user) {
      recommendationEngine.trackInteraction(req.user.id, null, 'search', {
        query,
        resultsCount: results.length,
      });
    }

    res.json({ query, results });
  } catch (error) {
    console.error('Semantic search failed:', error);
    res.status(500).json({ error: 'Semantic search failed' });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    await initializeSearch();

    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = semanticSearch.getSuggestions(q);
    res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Advanced search with filters
router.post('/advanced', async (req, res) => {
  try {
    const {
      query,
      genre,
      author,
      priceRange,
      rating,
      sortBy = 'relevance',
      limit = 20
    } = req.body;

    let searchResults = [];

    if (query) {
      await initializeSearch();
      searchResults = semanticSearch.search(query, limit * 2);
    } else {
      const books = await Book.find({});
      searchResults = books.map(book => ({ ...book._doc, relevanceScore: 0 }));
    }

    let filteredResults = searchResults;

    if (genre) {
      filteredResults = filteredResults.filter(book =>
        book.genre && book.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }

    if (author) {
      filteredResults = filteredResults.filter(book =>
        book.author && book.author.toLowerCase().includes(author.toLowerCase())
      );
    }

    if (priceRange) {
      const { min, max } = priceRange;
      filteredResults = filteredResults.filter(book =>
        book.price >= min && book.price <= max
      );
    }

    if (rating) {
      filteredResults = filteredResults.filter(book =>
        book.rating >= rating
      );
    }

    switch (sortBy) {
      case 'price-low':
        filteredResults.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filteredResults.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filteredResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'relevance':
      default:
        break;
    }

    const results = filteredResults.slice(0, limit);

    res.json({
      results,
      totalFound: filteredResults.length,
      filters: { genre, author, priceRange, rating, sortBy }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ error: 'Advanced search failed' });
  }
});

// Re-index fallback search index
router.post('/reindex', async (req, res) => {
  try {
    const books = await Book.find({});
    await semanticSearch.initializeIndex(books);
    searchInitialized = true;

    res.json({
      message: 'Search index rebuilt successfully',
      booksIndexed: books.length
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ error: 'Failed to rebuild search index' });
  }
});

export default router;
