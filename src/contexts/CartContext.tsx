import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface CartItem {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
  quantity: number;
  format: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (book: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const cartKey = user ? `cart_${user._id}` : 'cart_guest';

  // Helper to convert backend cart to CartItem[]
  const backendToCartItems = (backendCart: any[]): CartItem[] =>
    backendCart.map(item => ({
      id: item.book._id || item.book,
      title: item.book.title,
      author: item.book.author,
      price: item.book.price,
      coverImage: item.book.coverImage,
      quantity: item.quantity,
      format: item.format || '',
    }));

  // Helper to convert CartItem[] to backend format
  const cartItemsToBackend = (items: CartItem[]) =>
    items.map(item => ({
      book: item.id,
      quantity: item.quantity,
      format: item.format,
    }));

  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  // On login, fetch backend cart and merge with local cart
  useEffect(() => {
    const syncWithBackend = async () => {
      if (user && token) {
        try {
          const res = await axios.get('/users/cart');
          const backendCart = backendToCartItems(res.data);
          // Merge local and backend carts (sum quantities for duplicates)
          const localCart = (() => {
            const saved = localStorage.getItem(cartKey);
            if (saved) {
              try { return JSON.parse(saved); } catch { return []; }
            }
            return [];
          })();
          const itemMap = new Map();
          [...backendCart, ...localCart].forEach(item => {
            if (itemMap.has(item.id + '_' + item.format)) {
              const existing = itemMap.get(item.id + '_' + item.format);
              itemMap.set(item.id + '_' + item.format, { ...existing, quantity: existing.quantity + item.quantity });
            } else {
              itemMap.set(item.id + '_' + item.format, { ...item });
            }
          });
          const merged = Array.from(itemMap.values());
          setItems(merged);
          localStorage.setItem(cartKey, JSON.stringify(merged));
          // Save merged cart to backend
          await axios.post('/users/cart', { cart: cartItemsToBackend(merged) });
        } catch (err) {
          // fallback to local cart
        }
      }
    };
    syncWithBackend();
    // eslint-disable-next-line
  }, [user, token]);

  // Reload cart when user changes (for guest/user switch)
  useEffect(() => {
    if (!user) {
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    }
    // eslint-disable-next-line
  }, [cartKey, user]);

  // Save cart to localStorage and backend whenever items change
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(items));
    if (user && token) {
      axios.post('/users/cart', { cart: cartItemsToBackend(items) });
    }
    // eslint-disable-next-line
  }, [items, cartKey, user, token]);

  const addToCart = (book: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === book.id);
      
      if (existingItem) {
        toast.success('Quantity updated in cart');
        return prev.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        toast.success('Book added to cart');
        return [...prev, { ...book, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Book removed from cart');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success('Cart cleared');
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};