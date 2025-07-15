import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, BookOpen, Heart, Package, Settings, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UserProfile {
  name: string;
  email: string;
  profile: {
    bio: string;
    favoriteGenres: string[];
    readingGoal: number;
    location: string;
  };
  preferences: {
    authors: string[];
    genres: string[];
  };
}

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    profile: {
      bio: user?.profile?.bio || '',
      favoriteGenres: user?.profile?.favoriteGenres || [],
      readingGoal: user?.profile?.readingGoal || 12,
      location: user?.profile?.location || '',
    },
    preferences: {
      authors: user?.preferences?.authors || [],
      genres: user?.preferences?.genres || [],
    },
  });

  const [viewedBooks, setViewedBooks] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'viewed') {
      fetchViewedBooks();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    } else if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchViewedBooks = async () => {
    try {
      const response = await axios.get('/users/viewed-books');
      setViewedBooks(response.data);
    } catch (error) {
      console.error('Error fetching viewed books:', error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await axios.get('/users/wishlist');
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const validateProfile = () => {
    const newErrors: { [key: string]: string } = {};
    if (!profileData.name.trim()) newErrors.name = 'Name is required';
    if (!profileData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profileData.email)) newErrors.email = 'Invalid email';
    if (profileData.profile.readingGoal < 1) newErrors.readingGoal = 'Reading goal must be at least 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileUpdate = async () => {
    if (!validateProfile()) return;
    setLoading(true);
    try {
      const response = await axios.put('/users/profile', profileData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error updating profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    // Password validation: at least 8 characters, includes letter, number, special character
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setPasswordError('Password must be at least 8 characters and include letters, numbers, and special characters.');
      return;
    }
    setPasswordLoading(true);
    try {
      await axios.post('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Error changing password');
    }
    setPasswordLoading(false);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.') as [string, string];
      const parentValue = (profileData as any)[parent];

      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...(typeof parentValue === 'object' && parentValue !== null ? parentValue : {}),
          [child]: value,
        },
      }));
    } else {
      setProfileData(prev => ({ ...prev, [field]: value }));
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'viewed', label: 'Viewed Books', icon: BookOpen },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'password', label: 'Change Password', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-primary-600" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-primary-100">{user?.email}</p>
                <p className="text-primary-200 text-sm mt-1">
                  Member since {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={profileData.profile.location}
                      onChange={(e) => handleInputChange('profile.location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reading Goal</label>
                    <input
                      type="number"
                      value={profileData.profile.readingGoal}
                      onChange={(e) => handleInputChange('profile.readingGoal', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      aria-invalid={!!errors.readingGoal}
                    />
                    {errors.readingGoal && <p className="text-red-500 text-xs mt-1">{errors.readingGoal}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileData.profile.bio}
                    onChange={(e) => handleInputChange('profile.bio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'viewed' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Viewed Books</h3>
                {viewedBooks.length === 0 ? (
                  <p className="text-gray-500">No viewed books yet.</p>
                ) : (
                  <div className="space-y-4">
                    {viewedBooks.map((entry) => (
                      <div key={entry._id} className="flex items-center space-x-4 p-4 border rounded">
                        <img src={entry.book?.coverImage} alt={entry.book?.title} className="w-12 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{entry.book?.title}</h4>
                          <p className="text-gray-600">{entry.book?.author}</p>
                          <p className="text-sm text-gray-500">
                            Viewed on {entry.dateViewed ? new Date(entry.dateViewed).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        {entry.rating && (
                          <div className="text-yellow-500">{'★'.repeat(entry.rating)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Wishlist</h3>
                {wishlist.length === 0 ? (
                  <p className="text-gray-500">Your wishlist is empty.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((book) => (
                      <div key={book._id} className="border rounded p-4">
                        <img src={book.coverImage} alt={book.title} className="w-full h-48 object-cover rounded mb-4" />
                        <h4 className="font-semibold text-gray-900 mb-1">{book.title}</h4>
                        <p className="text-gray-600 mb-2">{book.author}</p>
                        <p className="text-lg font-bold text-primary-600">₹{book.price.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order History</h3>
                {orders.length === 0 ? (
                  <p className="text-gray-500">No orders yet.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border p-4 rounded-lg">
                        <h4 className="font-semibold">Order #{order.orderNumber} - ₹{order.total.toFixed(2)}</h4>
                        <p className="text-sm text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                          {order.items.map((item: any, i: number) => (
                            <li key={i}>{item.book.title} × {item.quantity}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Reading Preferences</h3>
                <p className="text-gray-600 mb-4">Help us personalize your recommendations.</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Genres</label>
                  <input
                    type="text"
                    value={profileData.preferences.genres.join(', ')}
                    onChange={(e) => handleInputChange('preferences.genres', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Authors</label>
                  <input
                    type="text"
                    value={profileData.preferences.authors.join(', ')}
                    onChange={(e) => handleInputChange('preferences.authors', e.target.value.split(',').map(s => s.trim()))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <button
                  onClick={handleProfileUpdate}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
