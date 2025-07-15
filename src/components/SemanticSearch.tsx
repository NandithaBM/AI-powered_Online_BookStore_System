import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { SearchResult } from '../types'; // adjust the path
import { semanticSearch } from '../api/semanticSearch';
import { useNavigate, useLocation } from 'react-router-dom';


interface SearchFilters {
  genre?: string;
  author?: string;
  priceRange?: { min: number; max: number };
  rating?: number;
  sortBy?: string;
}

// interface SearchResult {
//   _id: string;
//   title: string;
//   author: string;
//   genre: string;
//   price: number;
//   rating?: number;
//   description: string;
//   coverUrl: string;
//   relevanceScore?: number;
// }

interface SemanticSearchProps {
  onResults: (results: SearchResult[]) => void;
  placeholder?: string;
}

const SemanticSearch: React.FC<SemanticSearchProps> = ({ 
  onResults, 
  placeholder = "Search books by title, author, genre, or description..." 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<any[]>([]);

  // Sync input with URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q') || '';
    if (urlQuery !== query || results.length === 0) {
      setQuery(urlQuery);
      if (urlQuery) {
        handleSearch(urlQuery);
      }
    }
    // eslint-disable-next-line
  }, [location.search]);

  // Get search suggestions
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length >= 2) {
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(data.suggestions?.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(getSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle search
  const handleSearch = async (searchQuery?: string) => {
  setLoading(true);
    try {
      const q = typeof searchQuery === 'string' ? searchQuery : query;
      const data = await semanticSearch(q);
      setResults(data);
    if (onResults) {
        onResults(data.map((result: any) => ({
          _id: result.id || result._id,
          title: result.title,
          author: result.author,
          genre: Array.isArray(result.genre) ? result.genre : (result.genre ? [result.genre] : []),
          price: result.price,
          rating: result.rating,
          description: result.description,
          coverUrl: result.coverUrl,
          relevanceScore: result.relevanceScore,
          ratings: result.ratings || { average: 0, count: 0 },
        })));
      }
    } catch (err) {
      console.error('Semantic search failed:', err);
    if (onResults) onResults([]);
  } finally {
    setLoading(false);
  }
};

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  const clearFilters = () => {
    setFilters({});
    if (query) {
      handleSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <form
            onSubmit={e => {
              e.preventDefault();
              if (query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }
            }}
          >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-20 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            <button
                onClick={(e) => { e.preventDefault(); setShowFilters(!showFilters); }}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || Object.keys(filters).length > 0
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
                type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          </form>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-gray-700">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Advanced Filters</h3>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
              <select
                value={filters.genre || ''}
                onChange={(e) => updateFilter('genre', e.target.value || undefined)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genres</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
                <option value="Science Fiction">Science Fiction</option>
                <option value="Fantasy">Fantasy</option>
                <option value="Mystery">Mystery</option>
                <option value="Romance">Romance</option>
                <option value="Biography">Biography</option>
                <option value="History">History</option>
              </select>
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <input
                type="text"
                value={filters.author || ''}
                onChange={(e) => updateFilter('author', e.target.value || undefined)}
                placeholder="Author name"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => {
                    const min = e.target.value ? parseInt(e.target.value) : undefined;
                    updateFilter('priceRange', {
                      ...filters.priceRange,
                      min
                    });
                  }}
                  className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => {
                    const max = e.target.value ? parseInt(e.target.value) : undefined;
                    updateFilter('priceRange', {
                      ...filters.priceRange,
                      max
                    });
                  }}
                  className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={(e) => { e.preventDefault(); handleSearch(); }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.genre && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Genre: {Array.isArray(filters.genre) ? filters.genre.join(', ') : filters.genre}
              <button
                onClick={() => updateFilter('genre', undefined)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          )}
          {filters.author && (
            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Author: {filters.author}
              <button
                onClick={() => updateFilter('author', undefined)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.priceRange && (
            <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              Price: ${filters.priceRange.min || 0} - ${filters.priceRange.max || '∞'}
              <button
                onClick={() => updateFilter('priceRange', undefined)}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Search Results</h2>
          <ul>
            {results.map((book, index) => (
              <li key={index}>
                <b>{book.title}</b> by {book.author} (Score: {book.relevanceScore.toFixed(3)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SemanticSearch;