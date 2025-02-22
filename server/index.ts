import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { userRouter } from './routes/users';
import { chatRouter } from './routes/chats';
import { companyRouter } from './routes/companies';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB with more detailed logging
mongoose.connect('mongodb://localhost:27017/career-fair-chat')
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not initialized');
    
    console.log('Database:', db.databaseName);
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
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
app.use('/api/companies', companyRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 