// Enhanced Semantic Search with Advanced NLP
const natural = require('natural');
const TfIdf = natural.TfIdf;
const compromise = require('compromise');
const { Matrix } = require('ml-matrix');

class EnhancedSemanticSearchService {
  constructor() {
    this.tfidf = new TfIdf();
    this.documents = [];
    this.bookIndex = new Map();
    this.wordVectors = new Map();
    this.categoryWeights = {
      title: 3.0,
      author: 2.5,
      description: 1.0,
      genre: 2.0,
      tags: 1.5
    };
  }

  // Initialize the search index with enhanced processing
  async initializeIndex(books) {
    this.documents = [];
    this.bookIndex.clear();
    
    console.log('Initializing enhanced semantic search index...');
    
    books.forEach((book, index) => {
      const processedText = this.enhancedTextProcessing(book);
      this.tfidf.addDocument(processedText.combined);
      this.documents.push(processedText);
      this.bookIndex.set(index, book);
    });

    await this.buildWordVectors();
    console.log(`Enhanced search index initialized with ${books.length} books`);
  }

  // Advanced text processing with NLP
  enhancedTextProcessing(book) {
    const processed = {
      title: this.processText(book.title || ''),
      author: this.processText(book.author || ''),
      description: this.processText(book.description || ''),
      genre: this.processText(book.genre || ''),
      tags: this.processText(book.tags ? book.tags.join(' ') : ''),
      combined: ''
    };

    // Create weighted combined text
    processed.combined = [
      this.repeatText(processed.title, this.categoryWeights.title),
      this.repeatText(processed.author, this.categoryWeights.author),
      this.repeatText(processed.description, this.categoryWeights.description),
      this.repeatText(processed.genre, this.categoryWeights.genre),
      this.repeatText(processed.tags, this.categoryWeights.tags)
    ].join(' ');

    return processed;
  }

  // Process text with NLP techniques
  processText(text) {
    if (!text) return '';

    // Use compromise for better NLP processing
    const doc = compromise(text.toLowerCase());
    
    // Extract important terms
    const nouns = doc.nouns().out('array');
    const adjectives = doc.adjectives().out('array');
    const verbs = doc.verbs().out('array');
    
    // Combine and deduplicate
    const importantTerms = [...new Set([...nouns, ...adjectives, ...verbs])];
    
    // Add original text for context
    return `${text.toLowerCase()} ${importantTerms.join(' ')}`;
  }

  // Repeat text based on weight for TF-IDF boosting
  repeatText(text, weight) {
    if (!text) return '';
    const repeatCount = Math.ceil(weight);
    return Array(repeatCount).fill(text).join(' ');
  }

  // Build word vectors for semantic similarity
  async buildWordVectors() {
    const vocabulary = new Set();
    
    // Collect vocabulary
    this.documents.forEach(doc => {
      doc.combined.split(/\s+/).forEach(word => {
        if (word.length > 2) {
          vocabulary.add(word);
        }
      });
    });

    console.log(`Building word vectors for ${vocabulary.size} terms...`);
    
    // Simple word co-occurrence vectors (in production, use Word2Vec or BERT)
    for (const word of vocabulary) {
      this.wordVectors.set(word, this.calculateWordVector(word));
    }
  }

  // Calculate word vector based on co-occurrence
  calculateWordVector(targetWord) {
    const vector = new Array(100).fill(0); // 100-dimensional vector
    let occurrences = 0;

    this.documents.forEach(doc => {
      const words = doc.combined.split(/\s+/);
      const wordIndex = words.indexOf(targetWord);
      
      if (wordIndex !== -1) {
        occurrences++;
        // Context window of 5 words
        const start = Math.max(0, wordIndex - 5);
        const end = Math.min(words.length, wordIndex + 6);
        
        for (let i = start; i < end; i++) {
          if (i !== wordIndex) {
            const contextWord = words[i];
            const hash = this.simpleHash(contextWord) % 100;
            vector[hash] += 1;
          }
        }
      }
    });

    // Normalize vector
    if (occurrences > 0) {
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        return vector.map(val => val / magnitude);
      }
    }

    return vector;
  }

  // Simple hash function for word mapping
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Enhanced search with multiple similarity measures
  search(query, limit = 10, options = {}) {
    if (!query || this.documents.length === 0) {
      return [];
    }

    const processedQuery = this.processText(query);
    const results = [];

    // TF-IDF similarity
    const tfidfScores = this.calculateTfIdfSimilarity(processedQuery);
    
    // Semantic similarity using word vectors
    const semanticScores = this.calculateSemanticSimilarity(processedQuery);
    
    // Category-specific matching
    const categoryScores = this.calculateCategoryScores(query, options);

    // Combine scores
    for (let i = 0; i < this.documents.length; i++) {
      const book = this.bookIndex.get(i);
      if (!book) continue;

      const combinedScore = 
        (tfidfScores[i] || 0) * 0.4 +
        (semanticScores[i] || 0) * 0.4 +
        (categoryScores[i] || 0) * 0.2;

      if (combinedScore > 0.01) {
        results.push({
          ...book._doc || book,
          relevanceScore: combinedScore,
          scoreBreakdown: {
            tfidf: tfidfScores[i] || 0,
            semantic: semanticScores[i] || 0,
            category: categoryScores[i] || 0
          }
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // Calculate TF-IDF similarity
  calculateTfIdfSimilarity(query) {
    const queryVector = [];
    this.tfidf.tfidfs(query, (i, measure) => {
      queryVector[i] = measure;
    });

    const similarities = [];
    for (let i = 0; i < this.documents.length; i++) {
      const docVector = this.getDocumentVector(i);
      similarities[i] = this.cosineSimilarity(queryVector, docVector);
    }

    return similarities;
  }

  // Calculate semantic similarity using word vectors
  calculateSemanticSimilarity(query) {
    const queryWords = query.split(/\s+/).filter(word => word.length > 2);
    const similarities = [];

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const docWords = doc.combined.split(/\s+/).filter(word => word.length > 2);
      
      let totalSimilarity = 0;
      let comparisons = 0;

      queryWords.forEach(qWord => {
        const qVector = this.wordVectors.get(qWord);
        if (!qVector) return;

        docWords.forEach(dWord => {
          const dVector = this.wordVectors.get(dWord);
          if (!dVector) return;

          totalSimilarity += this.cosineSimilarity(qVector, dVector);
          comparisons++;
        });
      });

      similarities[i] = comparisons > 0 ? totalSimilarity / comparisons : 0;
    }

    return similarities;
  }

  // Calculate category-specific scores
  calculateCategoryScores(query, options) {
    const scores = new Array(this.documents.length).fill(0);
    const queryLower = query.toLowerCase();

    for (let i = 0; i < this.documents.length; i++) {
      const book = this.bookIndex.get(i);
      if (!book) continue;

      let score = 0;

      // Exact matches get higher scores
      if (book.title && book.title.toLowerCase().includes(queryLower)) {
        score += 0.8;
      }
      if (book.author && book.author.toLowerCase().includes(queryLower)) {
        score += 0.7;
      }
      if (book.genre && book.genre.toLowerCase().includes(queryLower)) {
        score += 0.6;
      }

      // Apply filters if provided
      if (options.genre && book.genre !== options.genre) {
        score *= 0.1;
      }
      if (options.author && !book.author.toLowerCase().includes(options.author.toLowerCase())) {
        score *= 0.1;
      }

      scores[i] = score;
    }

    return scores;
  }

  // Get document vector for TF-IDF
  getDocumentVector(docIndex) {
    const vector = {};
    this.tfidf.listTerms(docIndex).forEach(item => {
      vector[item.term] = item.tfidf;
    });
    return vector;
  }

  // Calculate cosine similarity
  cosineSimilarity(vecA, vecB) {
    if (Array.isArray(vecA) && Array.isArray(vecB)) {
      // Array vectors (word vectors)
      const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
      const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
      const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
      
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (normA * normB);
    } else {
      // Object vectors (TF-IDF)
      const allKeys = new Set([...Object.keys(vecA || {}), ...Object.keys(vecB || {})]);
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      allKeys.forEach(key => {
        const a = vecA[key] || 0;
        const b = vecB[key] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
      });

      normA = Math.sqrt(normA);
      normB = Math.sqrt(normB);

      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (normA * normB);
    }
  }

  // Get intelligent search suggestions
  getSuggestions(partialQuery, limit = 5) {
    if (!partialQuery || partialQuery.length < 2) return [];

    const suggestions = new Set();
    const query = partialQuery.toLowerCase();

    // Find matching terms from documents
    this.documents.forEach(doc => {
      const words = doc.combined.split(/\s+/);
      words.forEach(word => {
        if (word.includes(query) && word.length > query.length && word.length < 50) {
          suggestions.add(word);
        }
      });
    });

    // Also check book titles and authors for phrase matching
    for (const book of this.bookIndex.values()) {
      if (book.title && book.title.toLowerCase().includes(query)) {
        suggestions.add(book.title);
      }
      if (book.author && book.author.toLowerCase().includes(query)) {
        suggestions.add(book.author);
      }
    }

    return Array.from(suggestions)
      .slice(0, limit * 2)
      .sort((a, b) => a.length - b.length)
      .slice(0, limit);
  }
}

module.exports = new EnhancedSemanticSearchService();