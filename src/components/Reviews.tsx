import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  _id: string;
  user: {
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsProps {
  bookId: string;
}

const Reviews: React.FC<ReviewsProps> = ({ bookId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, [bookId]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/books/${bookId}/reviews`);
      setReviews(res.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setReviews([]); // No reviews found
      } else {
        setError('Failed to load reviews');
      }
    }
    setLoading(false);
  };

  const hasReviewed = user && reviews.some(r => r.user.name === user.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/books/${bookId}/reviews`, {
        rating: reviewRating,
        comment: reviewText,
      });
      toast.success('Review submitted successfully!');
      setReviewText('');
      setReviewRating(5);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reviews</h2>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <>
          {reviews.length === 0 ? (
            <p className="text-gray-600 dark:text-white mb-4">No reviews yet. Be the first to review this book!</p>
          ) : (
            <div className="space-y-6 mb-8">
              {reviews.map((review) => (
                <div key={review._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-sm p-4">
                  <div className="flex items-center mb-2">
                    {review.user.profile?.avatar ? (
                      <img src={review.user.profile.avatar} alt={review.user.name} className="w-8 h-8 rounded-full mr-2" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-500 font-bold">
                        {review.user.name[0]}
                      </div>
                    )}
                    <span className="font-semibold text-gray-900 dark:text-white mr-2">{review.user.name}</span>
                    <span className="flex items-center">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-white">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 dark:text-white">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {user && !hasReviewed && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Write a Review</h3>
              <div className="flex items-center mb-4">
                <span className="mr-2 text-gray-700 dark:text-white">Your Rating:</span>
                {[1,2,3,4,5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`h-6 w-6 ${star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg p-2 mb-4"
                rows={3}
                placeholder="Write your review here..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default Reviews; 