const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// Admin middleware (simplified)
const adminAuth = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get sales analytics
router.get('/sales', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await analyticsService.getSalesAnalytics(start, end);
    res.json(analytics);
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({ error: 'Failed to get sales analytics' });
  }
});

// Get stock alerts
router.get('/stock-alerts', auth, adminAuth, async (req, res) => {
  try {
    const alerts = await analyticsService.getStockAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Stock alerts error:', error);
    res.status(500).json({ error: 'Failed to get stock alerts' });
  }
});

// Get user analytics
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const analytics = await analyticsService.getUserAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
});

// Generate comprehensive report
router.get('/report', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const report = await analyticsService.generateReport(start, end);

    if (format === 'csv') {
      // Convert to CSV format for download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
      
      // Simple CSV conversion (in production, use a proper CSV library)
      const csv = convertReportToCSV(report);
      res.send(csv);
    } else {
      res.json(report);
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Helper function to convert report to CSV
function convertReportToCSV(report) {
  let csv = 'Analytics Report\n\n';
  
  // Sales summary
  csv += 'Sales Summary\n';
  csv += `Total Revenue,${report.sales.summary.totalRevenue}\n`;
  csv += `Total Orders,${report.sales.summary.totalOrders}\n`;
  csv += `Average Order Value,${report.sales.summary.averageOrderValue}\n\n`;
  
  // Daily sales
  csv += 'Daily Sales\n';
  csv += 'Date,Revenue,Orders\n';
  report.sales.dailySales.forEach(day => {
    const date = `${day._id.year}-${day._id.month}-${day._id.day}`;
    csv += `${date},${day.totalSales},${day.orderCount}\n`;
  });
  
  return csv;
}

module.exports = router;