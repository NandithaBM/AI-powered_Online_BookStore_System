import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Share2, 
  BookOpen, 
  Calendar,
  User,
  Package,
  Award,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import BookCard from '../components/BookCard';
import toast from 'react-hot-toast';
import { useWishlist } from '../contexts/WishlistContext';
import Reviews from '../components/Reviews';
import { getRecommendations } from '../api/recommend';
import RecommendationCard from '../components/RecommendationCard';

interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  coverImage: string;
  images: string[];
  ratings: {
    average: number;
    count: number;
    distribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
  genre: string[];
  format: string;
  publisher: string;
  publishedDate: string;
  pageCount: number;
  language: string;
  isbn?: string;
  inventory: {
    stock: number;
  };
  reviews: Array<{
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
  }>;
  similarBooks: Book[];
}

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, wishlist } = useWishlist();
  const isInWishlist = wishlist.some((b) => b._id === book?._id);
  const [recommendations, setRecommendations] = useState<any[]>([]);
   const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const fallbackImage = '/default-book-cover.png'; // Place this in your public directory

  useEffect(() => {
    if (id) {
      fetchBook();
      fetchRelatedBooks();
      fetchSentiment();
    }
  }, [id]);

  useEffect(() => {
    if (user && book?._id) {
      axios.post('/users/viewed-books', { bookId: book._id });
    }
  }, [user, book?._id]);

  const fetchBook = async () => {
    try {
      const response = await axios.get(`/books/${id}`);
      setBook(response.data);

      // Try to fetch recommendations, but don't block book display if it fails
      try {
        const recs = await getRecommendations(response.data._id);
        setRecommendations(recs);
        console.log('Recommendations:', recs);
      } catch (recError) {
        console.warn('Could not fetch recommendations:', recError);
        setRecommendations([]);
        // Optionally show a toast: toast.error('Could not load recommendations');
      }

    } catch (error) {
      console.error('Error fetching book:', error);
      toast.error('Error loading book details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedBooks = async () => {
    try {
      const response = await axios.get(`/books/${id}/related`);
      setRelatedBooks(response.data);
    } catch (error) {
      console.error('Error fetching related books:', error);
      setRelatedBooks([]);
    }
  };

  const fetchSentiment = async () => {
    try {
      const response = await axios.get(`/books/${id}/sentiment`);
      setSentiment(response.data);
    } catch (error) {
      setSentiment(null);
    }
  };

  const handleAddToCart = () => {
    if (!book) return;
    
    addToCart({
      id: book._id,
      title: book.title,
      author: book.author,
      price: book.price,
      coverImage: book.coverImage,
      format: book.format,
    });
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (book && book._id) {
      addToWishlist(book._id);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }

    try {
      await axios.post(`/books/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewText,
      });
      
      toast.success('Review submitted successfully!');
      setReviewText('');
      setReviewRating(5);
      setShowReviewForm(false);
      fetchBook(); // Refresh book data
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error submitting review';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Book not found</h2>
          <Link to="/books" className="text-primary-600 hover:text-primary-700">
            Browse all books
          </Link>
        </div>
      </div>
    );
  }

  const images = [book.coverImage, ...(book.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Link to="/books" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back to Books
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              <img
                src={images[selectedImage] || fallbackImage}
                alt={book.title}
                className="w-full h-96 object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).src = fallbackImage; }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${book.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Book Info */}
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{book.title}</h1>
              <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
              
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= book.ratings.average
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {book.ratings.average.toFixed(1)} ({book.ratings.count} reviews)
                </span>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{book.price.toFixed(2)}
                </span>
                {book.originalPrice && book.originalPrice > book.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{book.originalPrice.toFixed(2)}
                    </span>
                    <span className="bg-accent-100 text-accent-800 px-2 py-1 rounded text-sm font-semibold">
                      Save ₹{(book.originalPrice - book.price).toFixed(2)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={book.inventory.stock === 0}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {book.inventory.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleAddToWishlist}
                className="bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
                disabled={isInWishlist}
              >
                <Heart className={`h-5 w-5 mr-2 ${isInWishlist ? "text-red-500" : ""}`} />
                {isInWishlist ? "In Wishlist" : "Wishlist"}
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </div>

            {/* Book Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Book Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Format:</span>
                  <span className="ml-2 font-medium capitalize">{book.format}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Published:</span>
                  <span className="ml-2 font-medium">
                    {new Date(book.publishedDate).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Publisher:</span>
                  <span className="ml-2 font-medium">{book.publisher}</span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Pages:</span>
                  <span className="ml-2 font-medium">{book.pageCount}</span>
                </div>
                <div className="flex items-center">
                  <Award className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Language:</span>
                  <span className="ml-2 font-medium">{book.language}</span>
                </div>
                {book.isbn && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">ISBN:</span>
                    <span className="ml-2 font-medium">{book.isbn}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <span className="text-gray-600">Genres:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {book.genre.map((g) => (
                    <span
                      key={g}
                      className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
          <p className="text-gray-700 dark:text-white leading-relaxed">{book.description}</p>
        </div>

        {/* Related Books Section */}
        {relatedBooks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Related Books</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedBooks.map((related) => (
                <div key={related._id} className="flex flex-col items-center">
                  <BookCard book={related} />
                  {related.ratings && (
                    <span className="text-xs text-gray-500 mt-2">
                      Rating: {related.ratings.average?.toFixed(1) ?? 'N/A'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section (if any) */}
        {recommendations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendations.map((rec, idx) => (
                <div key={rec.id || rec._id || idx} className="flex flex-col">
                  <BookCard book={rec} />
                  {rec.explanation && (
                    <span className="text-xs text-gray-500 mt-2">{rec.explanation}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-12">
          {/* Sentiment Analytics */}
          {sentiment && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold dark:text-white mb-2">Review Sentiment Summary</h3>
              {/* Sentiment Bar Chart */}
              <div className="w-full max-w-md mb-4">
                <ResponsiveContainer width="100%" height={40}>
                  <BarChart
                    data={[
                      { name: 'Positive', value: sentiment.positive },
                      { name: 'Neutral', value: sentiment.neutral },
                      { name: 'Negative', value: sentiment.negative },
                    ]}
                    layout="vertical"
                    margin={{ left: 20, right: 20 }}
                  >
                    <XAxis type="number" hide domain={[0, Math.max(sentiment.positive, sentiment.neutral, sentiment.negative, 1)]} />
                    <YAxis type="category" dataKey="name" hide />
                    <RechartsTooltip formatter={(v) => [v, 'Reviews']} />
                    <Bar dataKey="value">
                      <Cell fill="#22c55e" />
                      <Cell fill="#a3a3a3" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-between text-xs text-gray-600 mt-1 px-2">
                  <span>Positive</span>
                  <span>Neutral</span>
                  <span>Negative</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  Positive: {sentiment.positive}
                </span>
                <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 font-medium">
                  Neutral: {sentiment.neutral}
                </span>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                  Negative: {sentiment.negative}
                </span>
                {typeof sentiment.averageScore === 'number' && (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium flex items-center" title="Average sentiment score (from review analysis)">
                    <Info className="w-4 h-4 mr-1 inline-block" />
                    Avg. Score: {sentiment.averageScore.toFixed(2)}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                  Total: {sentiment.total}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {book.ratings.average.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 ${
                      star <= book.ratings.average
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">{book.ratings.count} reviews</p>
            </div>
            
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <span className="text-sm text-gray-600 w-8">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${
                          book.ratings.count > 0
                            ? (book.ratings.distribution[rating as keyof typeof book.ratings.distribution] / book.ratings.count) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 ml-2 w-8">
                    {book.ratings.distribution[rating as keyof typeof book.ratings.distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Write Your Review</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`h-8 w-8 ${
                        star <= reviewRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    >
                      <Star className="h-full w-full" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Share your thoughts about this book..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {book.reviews.map((review) => (
              <div key={review._id} className="border-b border-gray-200 pb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{review.user.name}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Similar Books */}
        {book.similarBooks && book.similarBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Similar Books</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {book.similarBooks.slice(0, 4).map((similarBook) => (
                <BookCard key={similarBook._id} book={similarBook} />
              ))}
            </div>
          </div>
        )}

        {book && (
          <Reviews bookId={book._id!} />
        )}

        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg shadow p-4">
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
      </div>
    </div>
  );
};

export default BookDetail;