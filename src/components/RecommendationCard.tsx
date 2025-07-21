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
  dataPoints?: string[]; // <-- new field for granular XAI
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
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden" style={{ width: '286px', height: '486.75px' }}>
      {/* Image Flip Area */}
      <div className="relative h-48 group">
        <div className="w-full h-48 [perspective:1000px]">
          <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            {/* Front Side (Image) */}
            <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] flex items-center justify-center">
              <img
                src={book.coverUrl || '/api/placeholder/200/300'}
                alt={book.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            </div>
            {/* Back Side (Explanation, not reversed) */}
            <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center p-4 rounded-t-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <span className="text-xs text-gray-800 dark:text-gray-200 text-center line-clamp-5">{book.description}</span>
            </div>
          </div>
        </div>
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-white ${getScoreColor(score)}`}>{getScoreLabel(score)}</div>
        {score > 0 ? (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
            {Math.round(score * 100)}% match
          </div>
        ) : null}
      </div>
      {/* Card Content (static, always visible) */}
      <div className="p-4">
        {/* Book Info */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">
            {book.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">by {book.author}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{book.genre}</p>
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
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Why this recommendation?</h4>
              <div className="space-y-1">
                {Object.entries(reasons).map(([factor, value]) => (
                  <div key={factor} className="flex justify-between text-xs">
                    <span>{factor.charAt(0).toUpperCase() + factor.slice(1)}:</span>
                    <span className="font-medium">{Math.round(value * 100)}%</span>
                  </div>
                ))}
                  </div>
              {recommendation.dataPoints && recommendation.dataPoints.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Data points:</h5>
                  <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300">
                    {recommendation.dataPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                  </div>
                )}
              {/* Feedback UI */}
              <div className="mt-4 border-t pt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-gray-700 dark:text-gray-300">Was this explanation helpful?</span>
                  <button
                    className={`px-2 py-1 rounded ${feedback === 'up' ? 'bg-green-100' : 'bg-gray-100'} hover:bg-green-200`}
                    onClick={async () => {
                      setFeedback('up');
                      setFeedbackSubmitting(true);
                      await fetch('/api/ai-recommendations/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookId: book._id, feedback: 'up', comment })
                      });
                      setFeedbackSubmitting(false);
                      setFeedbackSubmitted(true);
                    }}
                    disabled={feedbackSubmitting || feedbackSubmitted}
                  >👍</button>
                  <button
                    className={`px-2 py-1 rounded ${feedback === 'down' ? 'bg-red-100' : 'bg-gray-100'} hover:bg-red-200`}
                    onClick={async () => {
                      setFeedback('down');
                      setFeedbackSubmitting(true);
                      await fetch('/api/ai-recommendations/feedback', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bookId: book._id, feedback: 'down', comment })
                      });
                      setFeedbackSubmitting(false);
                      setFeedbackSubmitted(true);
                    }}
                    disabled={feedbackSubmitting || feedbackSubmitted}
                  >👎</button>
                  </div>
                <textarea
                  className="w-full text-xs border rounded p-1 mb-1"
                  placeholder="Optional: Tell us why..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  disabled={feedbackSubmitting || feedbackSubmitted}
                  rows={2}
                />
                {feedbackSubmitted && (
                  <div className="text-xs text-green-600 mt-1">Thank you for your feedback!</div>
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