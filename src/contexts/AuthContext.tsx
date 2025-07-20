import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profile?: {
    avatar?: string;
    bio?: string;
    favoriteGenres?: string[];
    readingGoal?: number;           // ✅ Add this
  location?: string;  
  };
  wishlist?: string[];
  preferences?: {
    authors?: string[];
    genres?: string[];
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, mobile: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Only logout if unauthorized
        logout();
      } else {
        // For other errors, keep the user logged in and show a warning
        toast.error('Could not fetch user info. Please check your connection.');
      console.error('Fetch user error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { identifier, password });
      const { token: newToken, user: userData } = response.data;
      
      // --- Merge guest cart into user cart ---
      const guestCart = localStorage.getItem('cart_guest');
      const userCartKey = `cart_${userData._id}`;
      const userCart = localStorage.getItem(userCartKey);
      let mergedCart = [];
      if (guestCart) {
        const guestItems = JSON.parse(guestCart);
        let userItems = [];
        if (userCart) {
          userItems = JSON.parse(userCart);
        }
        // Merge logic: sum quantities for duplicate items
        const itemMap = new Map();
        [...userItems, ...guestItems].forEach(item => {
          if (itemMap.has(item.id)) {
            const existing = itemMap.get(item.id);
            itemMap.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
          } else {
            itemMap.set(item.id, { ...item });
          }
        });
        mergedCart = Array.from(itemMap.values());
        localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
        localStorage.removeItem('cart_guest');
      }
      // --- End merge ---

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Login successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, mobile: string) => {
    try {
      const response = await axios.post('/auth/register', { name, email, password, mobile });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};