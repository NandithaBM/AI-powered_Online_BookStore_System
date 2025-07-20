// Analytics Service for Admin Dashboard
const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');

const analyticsService = {
  getSalesAnalytics: async function(startDate, endDate) {
    try {
      console.log('getSalesAnalytics called with:', startDate, endDate);
      const matchQuery = {
        paymentStatus: 'paid',
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      const dailySales = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalSales: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]) || [];
      const topBooks = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.book',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'bookDetails'
          }
        }
      ]) || [];
      const genrePerformance = await Order.aggregate([
        { $match: matchQuery },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'books',
            localField: 'items.book',
            foreignField: '_id',
            as: 'book'
          }
        },
        { $unwind: '$book' },
        {
          $group: {
            _id: '$book.genre',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { revenue: -1 } }
      ]) || [];
      return {
        dailySales,
        topBooks,
        genrePerformance,
        summary: {
          totalRevenue: dailySales.reduce((sum, day) => sum + (day.totalSales || 0), 0),
          totalOrders: dailySales.reduce((sum, day) => sum + (day.orderCount || 0), 0),
          averageOrderValue: dailySales.length > 0
            ? dailySales.reduce((sum, day) => sum + (day.totalSales || 0), 0) /
              dailySales.reduce((sum, day) => sum + (day.orderCount || 0), 0)
            : 0
        }
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        dailySales: [],
        topBooks: [],
        genrePerformance: [],
        summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 }
      };
    }
  },
  getStockAlerts: async function() {
    try {
      const lowStockBooks = await Book.find({
        $or: [
          { 'inventory.stock': { $lte: 5 } },
          { 'inventory.stock': 0 }
        ]
      }).sort({ 'inventory.stock': 1 });
      const outOfStock = lowStockBooks.filter(book => book.inventory.stock === 0);
      const lowStock = lowStockBooks.filter(book => book.inventory.stock > 0 && book.inventory.stock <= 5);
      return {
        outOfStock,
        lowStock,
        totalAlerts: lowStockBooks.length
      };
    } catch (error) {
      console.error('Stock alerts error:', error);
      return { outOfStock: [], lowStock: [], totalAlerts: 0 };
    }
  },
  getUserAnalytics: async function() {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      const userGrowth = await User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]) || [];
      return {
        totalUsers,
        activeUsers,
        userGrowth,
        retentionRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('User analytics error:', error);
      return { totalUsers: 0, activeUsers: 0, userGrowth: [], retentionRate: 0 };
    }
  },
  generateReport: async function(startDate, endDate) {
    try {
      const [salesData, stockAlerts, userAnalytics] = await Promise.all([
        this.getSalesAnalytics(startDate, endDate),
        this.getStockAlerts(),
        this.getUserAnalytics()
      ]);
      return {
        period: { startDate, endDate },
        sales: salesData,
        inventory: stockAlerts,
        users: userAnalytics,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Report generation error:', error);
      return {
        period: { startDate, endDate },
        sales: { dailySales: [], topBooks: [], genrePerformance: [], summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 } },
        inventory: { outOfStock: [], lowStock: [], totalAlerts: 0 },
        users: { totalUsers: 0, activeUsers: 0, userGrowth: [], retentionRate: 0 },
        generatedAt: new Date()
      };
    }
  }
};

module.exports = analyticsService;