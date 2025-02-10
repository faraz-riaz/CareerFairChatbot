import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { userRouter } from './routes/users';
import { chatRouter } from './routes/chats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with more detailed logging
mongoose.connect('mongodb://localhost:27017/career-fair-chat')
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    console.log('Database:', mongoose.connection.db.databaseName);
    // List all collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) console.log('Error getting collections:', err);
      else console.log('Collections:', collections.map(c => c.name));
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/chats', chatRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 