const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB, sequelize } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { errorResponse } = require('./utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 5000;

// Promise-based initialization lock to prevent concurrent sync collisions on cold starts
let dbInitPromise = null;
const initDatabase = async () => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await connectDB();
      await sequelize.sync({ alter: false });
      console.log('[Database] Synchronized successfully.');
    })();
  }
  return dbInitPromise;
};

const ensureDbConnected = async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (err) {
    console.error('[Serverless DB Init Error]:', err);
    dbInitPromise = null; // Reset on failure to allow retry
    return errorResponse(res, 500, 'Database connection initialization failed', err.message);
  }
};

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes',
    data: null,
    errors: null
  }
});
app.use(limiter);

// Request Parsing & Logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ensure DB middleware on all API requests
app.use(ensureDbConnected);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'FinVista Enterprise API is running smoothly' });
});

// API Routes
app.use('/api', routes);
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
  return errorResponse(res, 404, `Route ${req.originalUrl} not found`);
});

// Global Error Handler Middleware
app.use(errorHandler);

// Standalone local listener
if (process.env.NODE_ENV !== 'production' || require.main === module) {
  const startServer = async () => {
    try {
      await initDatabase();
      app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 Server listening on port ${PORT}`);
        console.log(`=======================================================`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  };
  startServer();
}

module.exports = app;
