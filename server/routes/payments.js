const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Book = require('../models/Book');
const invoiceService = require('../services/invoiceService');

// Create payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress } = req.body;
    const userId = req.user.id;

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const book = await Book.findById(item.bookId);
      if (!book || book.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Book "${book?.title || 'Unknown'}" is not available in requested quantity` 
        });
      }

      const itemTotal = book.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        book: book._id,
        quantity: item.quantity,
        price: book.price,
        title: book.title
      });
    }

    // Add shipping cost
    const shippingCost = totalAmount > 50 ? 0 : 5.99;
    totalAmount += shippingCost;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe expects cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId,
        orderItems: JSON.stringify(orderItems.map(item => ({
          bookId: item.book,
          quantity: item.quantity,
          price: item.price
        }))),
        shippingCost: shippingCost.toString()
      }
    });

    // Create pending order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount: totalAmount,
      shippingAddress,
      billingAddress,
      shippingCost,
      paymentIntentId: paymentIntent.id,
      status: 'pending'
    });

    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      totalAmount: totalAmount
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment and complete order
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Find and update order
    const order = await Order.findById(orderId).populate('items.book');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update book stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(
        item.book._id,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Update order status
    order.status = 'completed';
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    await order.save();

    // Generate and send invoice
    try {
      const invoice = await invoiceService.generateInvoice(order);
      await invoiceService.sendInvoiceEmail(order.user, invoice);
    } catch (invoiceError) {
      console.error('Invoice generation error:', invoiceError);
      // Don't fail the order if invoice generation fails
    }

    res.json({
      success: true,
      order: order,
      message: 'Payment completed successfully'
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Get payment status
router.get('/status/:paymentIntentId', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const order = await Order.findOne({ paymentIntentId }).populate('items.book');

    res.json({
      paymentStatus: paymentIntent.status,
      order: order
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// Webhook to handle Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      
      // Update order status if not already updated
      try {
        const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        if (order && order.status === 'pending') {
          order.status = 'completed';
          order.paymentStatus = 'paid';
          order.paidAt = new Date();
          await order.save();
        }
      } catch (error) {
        console.error('Error updating order from webhook:', error);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed:', failedPayment.id);
      
      // Update order status to failed
      try {
        const order = await Order.findOne({ paymentIntentId: failedPayment.id });
        if (order) {
          order.status = 'failed';
          order.paymentStatus = 'failed';
          await order.save();
        }
      } catch (error) {
        console.error('Error updating failed order from webhook:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Refund payment
router.post('/refund', auth, async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order || order.paymentStatus !== 'paid') {
      return res.status(400).json({ error: 'Order cannot be refunded' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId,
      reason: reason || 'requested_by_customer'
    });

    // Update order status
    order.status = 'refunded';
    order.paymentStatus = 'refunded';
    order.refundedAt = new Date();
    order.refundReason = reason;
    await order.save();

    // Restore book stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(
        item.book,
        { $inc: { stock: item.quantity } }
      );
    }

    res.json({
      success: true,
      refund: refund,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router;