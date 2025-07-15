// Analytics Service for Admin Dashboard
const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');

class AnalyticsService {
  // Get sales analytics
  async getSalesAnalytics(startDate, endDate) {
    try {
      const matchQuery = {
        status: 'completed',
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      // Daily sales
      const dailySales = await Order.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalSales: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      // Top selling books
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
      ]);

      // Genre performance
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
      ]);

      return {
        dailySales,
        topBooks,
        genrePerformance,
        summary: {
          totalRevenue: dailySales.reduce((sum, day) => sum + day.totalSales, 0),
          totalOrders: dailySales.reduce((sum, day) => sum + day.orderCount, 0),
          averageOrderValue: dailySales.length > 0 ? 
            dailySales.reduce((sum, day) => sum + day.totalSales, 0) / 
            dailySales.reduce((sum, day) => sum + day.orderCount, 0) : 0
        }
      };
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }

  // Get stock alerts
  async getStockAlerts() {
    try {
      const lowStockBooks = await Book.find({
        $or: [
          { stock: { $lte: 5 } },
          { stock: 0 }
        ]
      }).sort({ stock: 1 });

      const outOfStock = lowStockBooks.filter(book => book.stock === 0);
      const lowStock = lowStockBooks.filter(book => book.stock > 0 && book.stock <= 5);

      return {
        outOfStock,
        lowStock,
        totalAlerts: lowStockBooks.length
      };
    } catch (error) {
      console.error('Stock alerts error:', error);
      throw error;
    }
  }

  // Get user analytics
  async getUserAnalytics() {
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
      ]);

      return {
        totalUsers,
        activeUsers,
        userGrowth,
        retentionRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('User analytics error:', error);
      throw error;
    }
  }

  // Generate comprehensive report
  async generateReport(startDate, endDate) {
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
      throw error;
    }
  }
}

module.exports = new AnalyticsService();