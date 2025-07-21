import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  Package,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlySales: Array<{
    _id: { year: number; month: number };
    sales: number;
    orders: number;
  }>;
}

// const AdminDashboard = () => {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchDashboardStats();
//   }, []);

//   const fetchDashboardStats = async () => {
//     try {
//       const response = await axios.get('/admin/dashboard');
//       setStats(response.data);
//     } catch (error) {
//       console.error('Error fetching dashboard stats:', error);
//       toast.error('Error loading dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   if (!stats) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//           <h2 className="text-xl font-semibold text-gray-900">Error loading dashboard</h2>
//         </div>
//       </div>
//     );
//   }
const AdminDashboard = () => {
  const navigate = useNavigate(); // ✅ must be at the top-level

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Error loading dashboard</h2>
        </div>
      </div>
    );
  }

  // ...rest of the component remains unchanged


  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks.toLocaleString(),
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-green-500',
      change: '+8%',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'bg-purple-500',
      change: '+15%',
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+22%',
    },
  ];

  // Format monthly sales data for charts
  const chartData = stats.monthlySales.map(item => ({
    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    sales: item.sales,
    orders: item.orders,
  }));


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Welcome back! Here's what's happening with your bookstore.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    {card.change} from last month
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Orders</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
             <button
  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
  onClick={() => navigate('/admin/books/new')}>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900 dark:text-white">Add New Book</span>
                </div>
              </button>
              <button
  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
  onClick={() => navigate('/admin/books')}
>
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900 dark:text-white">Manage Inventory</span>
                </div>
              </button>
              <button
  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
  onClick={() => navigate('/admin/orders')}
>
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 text-primary-600 mr-3" />
                  <span className="font-medium text-gray-900 dark:text-white">Process Orders</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
               onClick={() => navigate('/admin/analytics')}>
                <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-primary-600 mr-3" />
                <span className="font-medium text-gray-900 dark:text-white">Go to Analytics</span>
                </div>
              </button>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alerts & Notifications</h3>
            <div className="space-y-3">
              {stats.pendingOrders > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Pending Orders</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {stats.pendingOrders} orders need attention
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">System Update</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Scheduled maintenance tonight at 2 AM
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Sales Milestone</p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Congratulations! You've reached ₹10K in sales this month
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;