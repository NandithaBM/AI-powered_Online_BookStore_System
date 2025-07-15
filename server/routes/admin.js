import express from 'express';
import Book from '../models/Book.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(adminAuth);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Monthly sales
    const monthlySales = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          sales: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      totalBooks,
      totalUsers,
      totalOrders,
      pendingOrders,
      totalRevenue,
      monthlySales,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all books for admin
router.get('/books', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { author: new RegExp(search, 'i') },
        { isbn: new RegExp(search, 'i') },
      ];
    }
    if (status !== undefined) {
      filter.isActive = status === 'active';
    }

    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(filter);

    res.json({
      books,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get admin books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// // Create book
// router.post('/books', async (req, res) => {
//   try {
//     const book = new Book(req.body);
//     await book.save();

//     res.status(201).json({
//       message: 'Book created successfully',
//       book,
//     });
//   } catch (error) {
//     console.error('Create book error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// Create book
router.post('/books', async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      description,
      genre,
      language,
      publisher,
      publishedDate,
      pageCount,
      format,
      price,
      coverImage,
      stock,
      isFeatured,
      isNewRelease,
      tags,
      keywords,
      themes
    } = req.body;

    const newBook = new Book({
      title,
      author,
      isbn,
      description,
      genre,
      language,
      publisher,
      publishedDate,
      pageCount,
      format,
      price,
      coverImage,
      isActive: true,
      isFeatured: isFeatured || false,
      isNewRelease: isNewRelease || false, // ✅ <-- this line makes it work
      ratings: {
        average: 0,
        count: 0,
      },
      inventory: {
        stock,
        sold: 0,
      },
      tags,
      keywords,
      themes,
      metadata: {}
    });

    await newBook.save();

    res.status(201).json({
      message: 'Book created successfully',
      book: newBook,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update book
router.put('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      message: 'Book updated successfully',
      book,
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete book
router.delete('/books/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      message: 'Book deleted successfully',
      book,
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all orders for admin
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('items.book', 'title author')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { status, tracking } = req.body;
    
    const updateData = { status };
    if (tracking) {
      updateData.tracking = tracking;
    }
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;