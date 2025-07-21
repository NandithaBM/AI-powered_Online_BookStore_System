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
    description?: string; // Added description to the interface
  };
  showQuickActions?: boolean;
  viewMode?: 'grid' | 'list';
}

const BookCard: React.FC<BookCardProps> = ({ book, showQuickActions = true, viewMode = 'grid' }) => {
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

  const bookId = book._id || book.id || '';

  return (
    <div className={`group bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 overflow-visible flex flex-col relative [transform-style:preserve-3d] hover:scale-105 hover:-rotate-x-2 hover:rotate-y-2`} style={{ width: '200px', height: '450px' }}>
      <Link to={`/books/${bookId}`} className="flex-1 flex flex-col">
        <div className="relative h-72">
          <div className="w-full h-72 [perspective:1000px]">
            <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              {/* Front Side (Image) */}
              <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] flex items-center justify-center">
                <img
                  src={book.coverUrl || book.coverImage || '/default-book-cover.png'}
                  alt={book.title}
                  onError={e => { e.currentTarget.src = '/default-book-cover.png'; }}
                  className="w-full h-72 object-cover rounded-t-lg"
                />
                {Number(book.discount) > 0 && (
                  <div className="absolute top-2 left-2 bg-accent-500 text-white px-2 py-1 rounded text-sm font-semibold">
                    -{book.discount}%
                  </div>
                )}
              </div>
              {/* Back Side (Description, not reversed) */}
              <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 flex items-center justify-center p-4 rounded-t-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-xs text-gray-800 dark:text-gray-200 text-center line-clamp-5">{book.description}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col min-h-[8rem] relative pb-0">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-primary-600 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{book.author}</p>
          {/* Ratings above price, no extra margin below */}
          {book.ratings && typeof book.ratings.average === 'number' && (
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(book.ratings!.average) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                />
              ))}
              <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">{book.ratings.average.toFixed(1)}</span>
              {typeof book.ratings.count === 'number' && (
                <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({book.ratings.count})</span>
              )}
            </div>
          )}
          {/* Price and Add to Cart pinned to bottom */}
          <div className="mt-0 flex items-center justify-between w-full relative pb-0">
            <span className="text-lg font-bold text-gray-800 dark:text-white">${book.price}</span>
            {showQuickActions && (
              <button
                onClick={handleAddToCart}
                className="ml-2 bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors text-xs"
                aria-label="Add to cart"
              >
                <ShoppingCart className="inline-block w-4 h-4 mr-1" />
                Add
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BookCard;