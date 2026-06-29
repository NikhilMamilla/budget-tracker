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

// Middleware to ensure Database is connected and synced on serverless invocations
let dbInitialized = false;
const ensureDbConnected = async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await connectDB();
      await sequelize.sync({ alter: false });
      dbInitialized = true;
    } catch (err) {
      console.error('[Serverless DB Init Error]:', err);
    }
  }
  next();
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

// API Routes (Mounted on both /api and / for fail-safe serverless routing)
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
      await connectDB();
      await sequelize.sync({ alter: false });
      dbInitialized = true;
      console.log('[Database] Models synchronized successfully.');

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
