import mongoose from 'mongoose';
import { User } from './models/User';
import dotenv from 'dotenv';

dotenv.config();

async function testDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/career-fair-chat');
    console.log('Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      age: 25,
      jobTitle: 'Developer'
    });

    await testUser.save();
    console.log('Test user created:', testUser);

    // Verify we can read the user back
    const users = await User.find();
    console.log('All users:', users);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDB(); 