const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    match: /^[0-9]{10}$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profile: {
    avatar: String,
    bio: String,
    favoriteGenres: [String],
    readingGoal: {
      type: Number,
      default: 12,
    },
    location: String,
  },
  preferences: {
    authors: [String],
    genres: [String],
    languages: [String],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
    },
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
  }],
  viewedBooks: [{
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },
    dateViewed: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  }],
  recommendations: {
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    books: [{
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
      score: Number,
      reason: String,
    }],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  cart: [
    {
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      format: String,
    }
  ],
}, {
  timestamps: true,
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return require('bcryptjs').compare(candidatePassword, this.password);
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);