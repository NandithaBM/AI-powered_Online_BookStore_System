import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist, fetchWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line
  }, []);

  const handleAddToCart = (book: any) => {
    addToCart({
      id: book._id,
      title: book.title,
      author: book.author,
      price: book.price,
      coverImage: book.coverImage,
      format: book.format,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Save books you're interested in to your wishlist so you can easily find them later.
            </p>
            <Link
              to="/books"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Browse Books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((book) => (
              <div key={book._id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow p-4">
                <div className="relative">
                  <Link to={`/books/${book._id}`}>
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(book._id)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>

                <div className="p-4">
                  <Link to={`/books/${book._id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{book.title}</h3>
                  </Link>
                  <p className="text-gray-600 text-sm mb-2 dark:text-white">{book.author}</p>
                  
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600 ml-1">
                        {book.ratings.average.toFixed(1)} ({book.ratings.count})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${book.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(book)}
                      className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {book.genre.slice(0, 2).map((genre: string) => (
                        <span
                          key={genre}
                          className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;