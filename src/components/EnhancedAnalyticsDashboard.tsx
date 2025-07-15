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
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Download,
  RefreshCw,
  Target,
  Brain,
  Zap,
  Eye,
  Star,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface EnhancedAnalyticsData {
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
        genre: string;
      }>;
    }>;
    genrePerformance: Array<{
      _id: string;
      totalSold: number;
      revenue: number;
      avgRating: number;
    }>;
    summary: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      growthRate: number;
    };
  };
  ai: {
    recommendationStats: {
      totalRecommendations: number;
      clickThroughRate: number;
      conversionRate: number;
      topRecommendedGenres: Array<{
        genre: string;
        count: number;
        successRate: number;
      }>;
    };
    searchStats: {
      totalSearches: number;
      avgResultsPerSearch: number;
      topSearchTerms: Array<{
        term: string;
        count: number;
        resultQuality: number;
      }>;
    };
    userBehavior: {
      avgSessionDuration: number;
      bounceRate: number;
      pagesPerSession: number;
      topUserSegments: Array<{
        segment: string;
        count: number;
        value: number;
      }>;
    };
  };
  inventory: {
    outOfStock: Array<{
      _id: string;
      title: string;
      author: string;
      stock: number;
      demandScore: number;
    }>;
    lowStock: Array<{
      _id: string;
      title: string;
      author: string;
      stock: number;
      reorderPoint: number;
    }>;
    totalAlerts: number;
    turnoverRate: number;
  };
  predictions: {
    nextWeekSales: number;
    trendingGenres: Array<{
      genre: string;
      predictedGrowth: number;
      confidence: number;
    }>;
    seasonalTrends: Array<{
      month: string;
      predictedSales: number;
      confidence: number;
    }>;
  };
}

const EnhancedAnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'predictions'>('overview');

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedTimeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [salesResponse, aiResponse, inventoryResponse, predictionsResponse] = await Promise.all([
        fetch(`/api/analytics/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        fetch('/api/analytics/ai-insights'),
        fetch('/api/analytics/stock-alerts'),
        fetch('/api/analytics/predictions')
      ]);

      const [salesData, aiData, inventoryData, predictionsData] = await Promise.all([
        salesResponse.json(),
        aiResponse.json(),
        inventoryResponse.json(),
        predictionsResponse.json()
      ]);

      setData({
        sales: salesData,
        ai: aiData,
        inventory: inventoryData,
        predictions: predictionsData
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            AI-Powered Analytics
          </h1>
          <p className="text-gray-600 mt-1">Advanced insights and predictions for your bookstore</p>
        </div>
        
        <div className="flex flex-wrap items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'ai', label: 'AI Insights', icon: Brain },
            { id: 'predictions', label: 'Predictions', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow-md text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ₹{data.sales.summary.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">
                    +{data.sales.summary.growthRate.toFixed(1)}% vs last period
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow-md text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Orders</p>
                  <p className="text-2xl font-bold">
                    {data.sales.summary.totalOrders.toLocaleString()}
                  </p>
                  <p className="text-green-100 text-sm mt-1">
                    AOV: ₹{data.sales.summary.averageOrderValue.toFixed(2)}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-200" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg shadow-md text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">AI Recommendations</p>
                  <p className="text-2xl font-bold">
                    {data.ai.recommendationStats.totalRecommendations.toLocaleString()}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">
                    {data.ai.recommendationStats.conversionRate.toFixed(1)}% conversion rate
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-200" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg shadow-md text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Stock Alerts</p>
                  <p className="text-2xl font-bold">{data.inventory.totalAlerts}</p>
                  <p className="text-orange-100 text-sm mt-1">
                    Turnover: {data.inventory.turnoverRate.toFixed(1)}x/year
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-200" />
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.sales.dailySales.map(day => ({
                  date: `${day._id.month}/${day._id.day}`,
                  revenue: day.totalSales,
                  orders: day.orderCount
                }))}>
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

            {/* Genre Performance Radar */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Genre Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data.sales.genrePerformance.map(genre => ({
                  genre: genre._id,
                  sales: (genre.revenue / 1000), // Scale down for radar
                  rating: genre.avgRating * 20, // Scale up for radar
                  volume: genre.totalSold
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="genre" />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
                  <Radar
                    name="Sales (k$)"
                    dataKey="sales"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Rating (x20)"
                    dataKey="rating"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* AI Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">Recommendation Engine</h4>
                <Zap className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Click-through Rate</span>
                  <span className="font-semibold text-green-600">
                    {data.ai.recommendationStats.clickThroughRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate</span>
                  <span className="font-semibold text-blue-600">
                    {data.ai.recommendationStats.conversionRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                    style={{ width: `${data.ai.recommendationStats.conversionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">Search Performance</h4>
                <Eye className="w-6 h-6 text-purple-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Searches</span>
                  <span className="font-semibold">
                    {data.ai.searchStats.totalSearches.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Results</span>
                  <span className="font-semibold">
                    {data.ai.searchStats.avgResultsPerSearch.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">User Engagement</h4>
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Session Duration</span>
                  <span className="font-semibold">
                    {Math.round(data.ai.userBehavior.avgSessionDuration / 60)}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bounce Rate</span>
                  <span className="font-semibold text-red-600">
                    {data.ai.userBehavior.bounceRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Search Terms and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Search Terms</h3>
              <div className="space-y-3">
                {data.ai.searchStats.topSearchTerms.map((term, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{term.term}</span>
                      <p className="text-sm text-gray-600">{term.count} searches</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {(term.resultQuality * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Recommended Genres</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ai.recommendationStats.topRecommendedGenres}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="genre" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" name="Recommendations" />
                  <Bar dataKey="successRate" fill="#10B981" name="Success Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow-md text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Next Week Sales</h4>
                <Target className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">${data.predictions.nextWeekSales.toLocaleString()}</p>
              <p className="text-indigo-100 text-sm mt-2">Based on historical trends and seasonality</p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 rounded-lg shadow-md text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Trending Genre</h4>
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">
                {data.predictions.trendingGenres[0]?.genre || 'Fiction'}
              </p>
              <p className="text-green-100 text-sm mt-2">
                +{data.predictions.trendingGenres[0]?.predictedGrowth.toFixed(0) || '25'}% predicted growth
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-lg shadow-md text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Confidence Score</h4>
                <Brain className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold">
                {(data.predictions.trendingGenres[0]?.confidence * 100).toFixed(0) || '85'}%
              </p>
              <p className="text-orange-100 text-sm mt-2">Model prediction accuracy</p>
            </div>
          </div>

          {/* Seasonal Trends Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seasonal Sales Predictions</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.predictions.seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predictedSales"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                  name="Predicted Sales ($)"
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Confidence Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Trending Genres Prediction */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Genre Growth Predictions</h3>
            <div className="space-y-4">
              {data.predictions.trendingGenres.map((genre, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="font-medium">{genre.genre}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        +{genre.predictedGrowth.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {(genre.confidence * 100).toFixed(0)}% confidence
                      </p>
                    </div>
                    <div className="w-20">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${genre.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedAnalyticsDashboard;