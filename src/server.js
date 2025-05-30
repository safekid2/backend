const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/parents', require('./routes/parents'));
app.use('/api/v1/students', require('./routes/students'));
app.use('/api/v1', require('./routes/verification'));

// Handle 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
