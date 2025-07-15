import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SemanticSearch from '../components/SemanticSearch';
import BookCard from '../components/BookCard';
import RecommendationCard from '../components/RecommendationCard';
import { Sparkles } from 'lucide-react';
import { SearchResult } from '../types';
import { getRecommendations } from '../api/recommend';

interface Recommendation {
  book: {
    _id: string;
    title: string;
    author: string;
    genre: string;
    price: number;
    rating?: number;
    description: string;
    coverUrl: string;
    stock: number;
  };
  score: number;
  explanation: string;
  reasons: {
    genre: number;
    author: number;
    price: number;
    popularity: number;
    rating: number;
    newness: number;
  };
}

const SearchResults: React.FC = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/semantic-search?query=${encodeURIComponent(query)}&limit=20`);
      const data = await response.json();
      const results = data || [];
      setResults(results);
      // Fetch recommendations for the top result
      if (results.length > 0) {
        try {
          const recs = await getRecommendations(results[0].id);
          console.log('Recommendations:', recs);
          setRecommendations(recs);
        } catch (recError) {
          setRecommendations([]);
        }
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResults = (searchResults: SearchResult[]) => {
    setResults(searchResults);
  };

  const handleAddToWishlist = async (bookId: string) => {
    console.log('Add to wishlist:', bookId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search Bar */}
        <div className="mb-8">
          <SemanticSearch
            onResults={handleResults}
            placeholder="Search books with AI-powered semantic search..."
          />
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Search Results for "{query}"</h2>
            {/* Top result */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Top Result</h3>
              <BookCard book={results[0]} />
            </div>
            {/* Recommendations for top result */}
            {recommendations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-purple-700 mb-2">Recommended Books</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((rec) => (
                    <div key={rec._id || rec.id} className="bg-white rounded-lg shadow p-4">
                      <BookCard book={rec} />
                      <div className="mt-2 text-sm text-blue-700">
                        <b>Why recommended:</b> {rec.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Other search results */}
            {results.length > 1 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Other Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {results.slice(1).map((book) => (
                    <div key={book._id}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && showRecommendations && (
  <div className="mt-12">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800">AI-Powered Recommendations</h2>
      </div>
      <button
        onClick={() => setShowRecommendations(false)}
        className="text-gray-500 hover:text-gray-700"
      >
        Hide
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((recommendation, index) => (
        <div key={`rec-${recommendation.book._id}-${index}`}>
          <RecommendationCard
            recommendation={recommendation}
            onAddToWishlist={handleAddToWishlist}
          />
          <div className="text-sm text-gray-600 mt-2">
            <strong>Why this book?</strong> {recommendation.explanation}
          </div>
        </div>
      ))}
    </div>
  </div>
)}


        {/* No results */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 mb-6">Try a different search keyword.</p>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
