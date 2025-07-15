import express from 'express';
import Order from '../models/Order.js';
import Book from '../models/Book.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Utility to generate unique order number
const generateOrderNumber = () => {
  return 'ORD-' + Date.now();
};

// Create Order
router.post('/', auth, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shipping,
    } = req.body;

    // Validate items and calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book || book.inventory.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${book?.title || 'book'}`,
        });
      }

      const itemTotal = book.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        book: item.bookId,
        quantity: item.quantity,
        price: book.price,
        discount: book.discount,
      });
    }

    const tax = subtotal * 0.085;
    const total = subtotal + tax + shipping.cost;

    const orderNumber = generateOrderNumber();

    const order = new Order({
      orderNumber,
      user: req.user.userId,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      shippingAddress,
      billingAddress,
      paymentStatus: 'paid',
    });

    await order.save();

    // Update book inventory
    for (const item of items) {
      await Book.findByIdAndUpdate(item.bookId, {
        $inc: {
          'inventory.stock': -item.quantity,
          'inventory.reserved': item.quantity,
        },
      });
    }

    await order.populate('items.book', 'title author coverImage');

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const orders = await Order.find({ user: req.user.userId })
      .populate('items.book', 'title author coverImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ user: req.user.userId });

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.userId,
    }).populate('items.book', 'title author coverImage');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore inventory
    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: {
          'inventory.stock': item.quantity,
          'inventory.reserved': -item.quantity,
        },
      });
    }

    res.json({
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
