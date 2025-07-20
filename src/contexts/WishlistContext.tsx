import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface WishlistBook {
  _id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  ratings: {
    average: number;
    count: number;
  };
  genre: string[];
  format: string;
}

interface WishlistContextType {
  wishlist: WishlistBook[];
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addToWishlist: (bookId: string) => Promise<void>;
  removeFromWishlist: (bookId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/users/wishlist');
      setWishlist(res.data);
    } catch (err) {
      setWishlist([]);
    }
    setLoading(false);
  };

  const addToWishlist = async (bookId: string) => {
    try {
      await axios.post(`/users/wishlist/${bookId}`);
      await fetchWishlist(); // Always fetch the latest from backend
      toast.success('Added to wishlist');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error adding to wishlist');
    }
  };

  const removeFromWishlist = async (bookId: string) => {
    try {
      const res = await axios.delete(`/users/wishlist/${bookId}`);
      setWishlist(res.data.wishlist);
      toast.success('Removed from wishlist');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error removing from wishlist');
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, fetchWishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}; 