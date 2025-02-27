import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { userRouter } from './routes/users';
import { chatRouter } from './routes/chats';
import { companyRouter } from './routes/companies';
import { recommendationRouter } from './routes/recommendations';
import { initializeServices } from './services/initServices';
import { uploadsRouter } from './routes/uploads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true, // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/users', userRouter);
app.use('/api/chats', chatRouter);
app.use('/api/companies', companyRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/uploads', uploadsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB and start server
mongoose.connect('mongodb://localhost:27017/career-fair-chat')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize services after database connection
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 