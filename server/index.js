import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import recommendationRoutes from './routes/ai-recommendations.js';
import searchRoutes from './routes/search.js';
import reviewRoutes from './routes/reviews.js';

// Add these lines for the new AI/NLP proxy routes
import semanticSearchRouter from './routes/semantic-search.js';
import sentimentRouter from './routes/sentiment.js';
import recommendRouter from './routes/recommend.js';
import recommendationsRoutes from './routes/recommendations.js';

dotenv.config();
// console.log('GMAIL_USER:', process.env.GMAIL_USER);
// console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Loaded' : 'Missing');
// console.log('JWT_SECRET:', process.env.JWT_SECRET);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/books';

// ------------------ Middleware ------------------

// Security headers
app.use(helmet());
app.use(compression());

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
});
app.use(limiter);

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ------------------ MongoDB Connection ------------------

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ------------------ Routes ------------------

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-recommendations', recommendationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
// Register new routes
app.use('/api/semantic-search', semanticSearchRouter);
app.use('/api/sentiment', sentimentRouter);
app.use('/api/recommend', recommendRouter);
app.use('/api/recommendations', recommendationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 fallback
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error stack:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
