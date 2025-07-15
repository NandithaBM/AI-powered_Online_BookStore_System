import React, { useState } from 'react';
import { Heart, ShoppingCart, Info, Star } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

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

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAddToWishlist?: (bookId: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAddToWishlist
}) => {
  const { book, explanation, score, reasons } = recommendation;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await addToCart({
  id: book._id,
  title: book.title,
  author: book.author,
  price: book.price,
  coverImage: book.coverUrl,
  format: 'paperback', // or another default if applicable
});

      
      // Track interaction
      if (user) {
        fetch('/api/ai-recommendations/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: book._id,
            action: 'add_to_cart',
            metadata: { source: 'recommendation', score }
          })
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (onAddToWishlist) {
      onAddToWishlist(book._id);
      
      // Track interaction
      if (user) {
        fetch('/api/ai-recommendations/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookId: book._id,
            action: 'add_to_wishlist',
            metadata: { source: 'recommendation', score }
          })
        });
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Highly Recommended';
    if (score >= 0.6) return 'Good Match';
    return 'Suggested';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Recommendation Score Badge */}
      <div className="relative">
        <img
          src={book.coverUrl || '/api/placeholder/200/300'}
          alt={book.title}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-white ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </div>
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
          {Math.round(score * 100)}% match
        </div>
      </div>

      <div className="p-4">
        {/* Book Info */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-1">by {book.author}</p>
          <p className="text-sm text-gray-500">{book.genre}</p>
        </div>

        {/* Rating */}
        {book.rating && (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(book.rating!)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {book.rating.toFixed(1)}
            </span>
          </div>
        )}

        {/* AI Explanation */}
        <div className="mb-4">
          <div className="flex items-start space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-1">
              <Info className="w-3 h-3" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation}
              </p>
              {!showExplanation && (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                >
                  Show details
                </button>
              )}
            </div>
          </div>

          {/* Detailed Explanation */}
          {showExplanation && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Why this recommendation?</h4>
              <div className="space-y-1">
                {reasons.genre > 0.1 && (
                  <div className="flex justify-between text-xs">
                    <span>Genre match:</span>
                    <span className="font-medium">{Math.round(reasons.genre * 100)}%</span>
                  </div>
                )}
                {reasons.author > 0.1 && (
                  <div className="flex justify-between text-xs">
                    <span>Author preference:</span>
                    <span className="font-medium">{Math.round(reasons.author * 100)}%</span>
                  </div>
                )}
                {reasons.rating > 0.1 && (
                  <div className="flex justify-between text-xs">
                    <span>High rating:</span>
                    <span className="font-medium">{Math.round(reasons.rating * 100)}%</span>
                  </div>
                )}
                {reasons.popularity > 0.05 && (
                  <div className="flex justify-between text-xs">
                    <span>Popularity:</span>
                    <span className="font-medium">{Math.round(reasons.popularity * 100)}%</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-xs text-gray-600 hover:text-gray-700 mt-2"
              >
                Hide details
              </button>
            </div>
          )}
        </div>

        {/* Price and Stock */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-gray-800">${book.price}</span>
          <span className={`text-sm ${book.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleAddToCart}
            disabled={loading || book.stock === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{loading ? 'Adding...' : 'Add to Cart'}</span>
          </button>
          <button
            onClick={handleWishlist}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;