const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Fixed Mongo Sanitize Middleware
app.use((req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }

  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }

  next();
});

// Apply general API limiter to all /api routes
app.use('/api', apiLimiter);

// Database Connection
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maki';

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) =>
    console.log('MongoDB connection error:', err)
  );

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const connectionRoutes = require('./routes/connectionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/connections', connectionRoutes);

// Root Route
app.get('/', (req, res) => {
  res.send('Maki API is secure and running');
});

// Generic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message:
      err.message ||
      'An unexpected error occurred on the server.',
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const socket = require('./socket');
socket.init(server);