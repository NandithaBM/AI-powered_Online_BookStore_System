/**
 * Semantic Search Service
 * ───────────────────────────────────────────────────────────
 * ▸ Default: TF‑IDF + cosine‑similarity (local, no deps)
 * ▸ Optional: SBERT embedding + FAISS ANN (remote Python API)
 *   – Set VECTOR_SEARCH_URL env var (e.g. http://localhost:8000/search)
 *   – If the remote call fails, code falls back to TF‑IDF
 */

const natural = require('natural');
const axios   = require('axios');

const TfIdf = natural.TfIdf;

class SemanticSearchService {
  constructor() {
    this.tfidf      = new TfIdf();
    this.documents  = [];            // raw concat‑text per book
    this.bookIndex  = new Map();     // docIndex → Book instance
    this.vectorURL  = process.env.VECTOR_SEARCH_URL || null;
  }

  /* ─────────────────────────  INDEXING  ───────────────────────── */

  /**
   * Build / rebuild the local TF‑IDF index.
   * @param {Array<Book>} books
   */
  async initializeIndex(books = []) {
    this.tfidf      = new TfIdf();   // reset
    this.documents  = [];
    this.bookIndex.clear();

    books.forEach((book, idx) => {
      const doc = this._makeSearchableText(book);
      this.tfidf.addDocument(doc);
      this.documents.push(doc);
      this.bookIndex.set(idx, book);
    });

    console.log(`[semanticSearch] indexed ${books.length} books`);
  }

  /**
   * Pick fields we care about & stringify them.
   */
  _makeSearchableText(book) {
    const fields = [
      book.title,
      book.author,
      book.description,
      book.genre,
      Array.isArray(book.tags) ? book.tags.join(' ') : '',
      book.isbn
    ].filter(Boolean);               // remove falsy values

    return fields.join(' ').toLowerCase();
  }

  /* ─────────────────────────── SEARCH  ────────────────────────── */

  /**
   * Semantic search that first tries SBERT + FAISS, then falls back to TF‑IDF.
   * @param {String} query
   * @param {Number} limit
   * @return {Promise<Array<Book & { relevanceScore:number }>>>}
   */
  async search(query = '', limit = 10) {
    if (!query.trim()) return [];

    /* ---- 1) Try vector search if configured ---- */
    if (this.vectorURL) {
      try {
        const { data } = await axios.post(this.vectorURL, {
          query, k: limit
        }, { timeout: 1_500 });      // fail fast in ≤1.5 s

        // Expected payload: [{ book:{..}, score:<distance> }, ...]
        if (Array.isArray(data.results)) {
          return data.results.map(r => ({
            ...r.book,
            relevanceScore: 1 - r.score   // FAISS -> lower distance == better
          }));
        }
      } catch (err) {
        console.warn('[semanticSearch] vector API failed – falling back', err.message);
      }
    }

    /* ---- 2) Local TF‑IDF fallback ---- */
    return this._tfidfSearch(query, limit);
  }

  /**
   * Pure TF‑IDF search (sync, fast).
   * @private
   */
  _tfidfSearch(query, limit = 10) {
    if (!this.documents.length) return [];

    // Build query vector
    const qVec = [];
    this.tfidf.tfidfs(query.toLowerCase(), (i, val) => (qVec[i] = val));

    // Cosine similarity vs every doc
    const scored = [];
    for (let i = 0; i < this.documents.length; i++) {
      const sim = this._cosine(qVec, this._docVector(i));
      if (sim > 0.01) {              // tiny threshold
        scored.push({ book: this.bookIndex.get(i), sim });
      }
    }

    return scored
      .sort((a, b) => b.sim - a.sim)
      .slice(0, limit)
      .map(({ book, sim }) => ({
        ...(book._doc || book),       // works for both Mongoose doc & plain obj
        relevanceScore: sim
      }));
  }

  /* ───────────────────────  VECTORS & MATH  ───────────────────── */

  _docVector(i) {
    const vec = {};
    this.tfidf.listTerms(i).forEach(({ term, tfidf }) => (vec[term] = tfidf));
    return vec;
  }

  _dot(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let sum = 0;
    keys.forEach(k => { sum += (a[k] || 0) * (b[k] || 0); });
    return sum;
  }

  _cosine(a, b) {
    const denom = Math.sqrt(this._dot(a, a)) * Math.sqrt(this._dot(b, b));
    return denom ? this._dot(a, b) / denom : 0;
  }

  /* ───────────────────────  SUGGESTIONS  ─────────────────────── */

  /**
   * Very simple prefix suggestions (can be replaced by vector API later).
   */
  getSuggestions(partial = '', limit = 5) {
    if (partial.length < 2) return [];
    const q = partial.toLowerCase();
    const found = new Set();

    this.documents.forEach(doc => {
      doc.split(/\s+/).forEach(word => {
        if (word.startsWith(q) && word.length > q.length) found.add(word);
      });
    });

    return [...found].slice(0, limit);
  }
}

module.exports = new SemanticSearchService();
