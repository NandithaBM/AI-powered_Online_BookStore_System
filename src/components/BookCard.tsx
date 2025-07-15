import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useWishlist } from '../contexts/WishlistContext';

interface BookCardProps {
  book: {
    _id?: string;
    id?: string;
    title: string;
    author: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    coverImage: string;
    coverUrl?: string;
    ratings?: {
      average: number;
      count: number;
    };
    genre: string[];
    format?: string;
    explanation?: string;
  };
  showQuickActions?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ book, showQuickActions = true }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToWishlist, wishlist } = useWishlist();

  const isInWishlist = wishlist.some((b) => b._id === (book._id || book.id || ''));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: book._id || book.id || '',
      title: book.title,
      author: book.author,
      price: book.price,
      coverImage: book.coverImage,
      format: book.format || '',
    });
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    addToWishlist(book._id || book.id || '');
  };

  const fallbackImage = '/default-book-cover.png'; // Place a default image in your public folder

  // If genre is an array, join it. If it's a string, just show it. If missing, show "Unknown".
  const genreDisplay = Array.isArray(book?.genre)
    ? book.genre.slice(0, 2).join(', ')
    : book?.genre || "Unknown";

  return (
    <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <Link to={`/books/${book._id || book.id || ''}`}>
        <div className="relative overflow-hidden">
          <img
            src={book.coverImage || book.coverUrl || fallbackImage}
            alt={book.title}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.currentTarget as HTMLImageElement).src = fallbackImage; }}
          />
          {book.discount && book.discount > 0 && (
            <div className="absolute top-2 left-2 bg-accent-500 text-white px-2 py-1 rounded text-sm font-semibold">
              -{book.discount}%
            </div>
          )}
          {showQuickActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleAddToWishlist}
                className="bg-white p-2 rounded-full shadow-md hover:bg-gray-50 mb-2 block"
                aria-label={isInWishlist ? "In wishlist" : "Add to wishlist"}
                disabled={isInWishlist}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? "text-red-500" : "text-gray-600"}`} />
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2">{book.author || "Unknown Author"}</p>
          
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600 ml-1">
                {book?.ratings?.average?.toFixed(1)} ({book?.ratings?.count})
              </span>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {genreDisplay}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">
                ₹{book?.price?.toFixed(2)}
              </span>
              {book?.originalPrice && book?.originalPrice > book?.price && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{book?.originalPrice?.toFixed(2)}
                </span>
              )}
            </div>
            {showQuickActions && (
              <button
                onClick={handleAddToCart}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors opacity-0 group-hover:opacity-100"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BookCard;