import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Download
} from 'lucide-react';

interface AnalyticsData {
  sales: {
    dailySales: Array<{
      _id: { year: number; month: number; day: number };
      totalSales: number;
      orderCount: number;
    }>;
    topBooks: Array<{
      _id: string;
      totalSold: number;
      revenue: number;
      bookDetails: Array<{
        title: string;
        author: string;
        coverUrl: string;
      }>;
    }>;
    genrePerformance: Array<{
      _id: string;
      totalSold: number;
      revenue: number;
    }>;
    summary: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
    };
  };
  inventory: {
    outOfStock: Array<{
      _id: string;
      title: string;
      author: string;
      stock: number;
    }>;
    lowStock: Array<{
      _id: string;
      title: string;
      author: string;
      stock: number;
    }>;
    totalAlerts: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    userGrowth: Array<{
      _id: { year: number; month: number };
      newUsers: number;
    }>;
    retentionRate: string;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [salesResponse, stockResponse, userResponse] = await Promise.all([
        fetch(`/api/analytics/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch('/api/analytics/stock-alerts'),
        fetch('/api/analytics/users')
      ]);

      const [salesData, stockData, userData] = await Promise.all([
        salesResponse.json(),
        stockResponse.json(),
        userResponse.json()
      ]);

      setData({
        sales: salesData,
        inventory: stockData,
        users: userData
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(
        `/api/analytics/report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&format=csv`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'analytics-report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-gray-600">Failed to load analytics data</div>;
  }

  // Prepare chart data
  const salesChartData = data.sales.dailySales.map(day => ({
    date: `${day._id.month}/${day._id.day}`,
    revenue: day.totalSales,
    orders: day.orderCount
  }));

  const genreChartData = data.sales.genrePerformance.map(genre => ({
    name: genre._id,
    revenue: genre.revenue,
    sold: genre.totalSold
  }));

  const userGrowthData = data.users.userGrowth.map(month => ({
    month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
    users: month.newUsers
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-800">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.sales.summary.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.sales.summary.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.users.activeUsers.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {data.users.retentionRate}% retention
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.inventory.totalAlerts}
              </p>
              <p className="text-sm text-red-500">
                {data.inventory.outOfStock.length} out of stock
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Genre Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genreChartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="revenue"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {genreChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10B981"
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Books */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Books</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.sales.topBooks.slice(0, 10).map((book, index) => (
              <div key={book._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {book.bookDetails[0]?.title || 'Unknown Title'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {book.bookDetails[0]?.author || 'Unknown Author'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{book.totalSold} sold</p>
                  <p className="text-xs text-gray-500">${book.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      {data.inventory.totalAlerts > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            Stock Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Out of Stock */}
            {data.inventory.outOfStock.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-3">Out of Stock ({data.inventory.outOfStock.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.inventory.outOfStock.map(book => (
                    <div key={book._id} className="p-3 bg-red-50 rounded-lg">
                      <p className="font-medium text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-600">{book.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Stock */}
            {data.inventory.lowStock.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-600 mb-3">Low Stock ({data.inventory.lowStock.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.inventory.lowStock.map(book => (
                    <div key={book._id} className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">{book.author}</p>
                        </div>
                        <span className="text-sm font-semibold text-yellow-600">
                          {book.stock} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;