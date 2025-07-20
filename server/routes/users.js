const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const Book = require('../models/Book.js');
const { auth } = require('../middleware/auth.js');

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile (including preferences)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      profile: user.profile,
      preferences: user.preferences,
      email: user.email,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      _id: user._id,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get wishlist
router.get('/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('wishlist', 'title author coverImage price ratings genre');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.wishlist);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to wishlist
router.post('/wishlist/:bookId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const book = await Book.findById(req.params.bookId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (user.wishlist.includes(req.params.bookId)) {
      return res.status(400).json({ message: 'Book already in wishlist' });
    }

    user.wishlist.push(req.params.bookId);
    await user.save();

    res.json({
      message: 'Book added to wishlist',
      wishlist: user.wishlist,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/:bookId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.wishlist = user.wishlist.filter(
      bookId => bookId.toString() !== req.params.bookId
    );
    await user.save();

    // Re-populate wishlist with book details
    const updatedUser = await User.findById(req.user.userId)
      .populate('wishlist', 'title author coverImage price ratings genre');

    res.json({
      message: 'Book removed from wishlist',
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get viewed books
router.get('/viewed-books', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('viewedBooks.book', 'title author coverImage genre');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.viewedBooks);
  } catch (error) {
    console.error('Get viewed books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add to viewed books
router.post('/viewed-books', auth, async (req, res) => {
  try {
    const { bookId, rating } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingEntry = user.viewedBooks.find(
      entry => entry.book.toString() === bookId
    );

    if (existingEntry) {
      existingEntry.rating = rating;
      existingEntry.dateViewed = new Date();
    } else {
      user.viewedBooks.push({
        book: bookId,
        rating,
        dateViewed: new Date(),
      });
    }

    await user.save();

    res.json({
      message: 'Viewed books updated',
      viewedBooks: user.viewedBooks,
    });
  } catch (error) {
    console.error('Add to viewed books error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;