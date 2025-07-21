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
    } else {
      setResults([]);
      setRecommendations([]);
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search Bar */}
        <div className="mb-8">
          <SemanticSearch
            onResults={handleResults}
            placeholder="Search books with AI-powered semantic search..."
          />
        </div>

        {/* Loading spinner (always show if loading) */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-blue-700 text-lg">Searching for books...</span>
          </div>
        )}

        {/* Search Results Summary/Heading */}
        {!loading && results.length > 0 && (
          <div className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 mb-6">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Search Results</h2>
            {/* Top result */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Top Result</h3>
              <BookCard book={results[0]} />
            </div>
            {/* Recommendations for top result */}
            {recommendations.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">Recommended Books</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((rec) => (
                    <div key={rec._id || rec.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow p-4">
                      <RecommendationCard
                        recommendation={rec.book ? rec : {
                          book: {
                            ...rec,
                            description: rec.description || '', // Use the real description
                          },
                          score: rec.score || 0,
                          explanation: rec.explanation || '',
                          reasons: rec.reasons || {},
                          dataPoints: rec.dataPoints || [],
                        }}
                        onAddToWishlist={handleAddToWishlist}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Other search results */}
            {results.length > 1 && (
              <>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Other Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {results.slice(1).map((book) => (
                    <div key={book._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow p-4">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Recommendations */}
        {!loading && recommendations.length > 0 && showRecommendations && (
  <div className="mt-12">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Recommendations</h2>
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
        <div key={`rec-${recommendation.book?._id || recommendation._id || recommendation.id || index}`} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow p-4">
          <RecommendationCard
            recommendation={recommendation.book ? recommendation : {
              book: recommendation,
              score: recommendation.score || 0,
              explanation: recommendation.explanation || '',
              reasons: recommendation.reasons || {},
              dataPoints: recommendation.dataPoints || [],
            }}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>
      ))}
    </div>
  </div>
)}


        {/* No results */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-6">Try a different search keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
