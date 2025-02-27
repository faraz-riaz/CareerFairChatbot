import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// *** Update user profile - IMPORTANT: This route must come BEFORE the generic /:id route! ***
router.patch('/profile', auth, async (req, res) => {
  try {
    // Extract the userId from the token data
    const userId = req.user.userId;
    
    console.log('Updating profile for user:', userId);
    console.log('Update data:', req.body);
    
    if (!userId) {
      console.error('No user ID found in token');
      return res.status(401).json({ error: 'User identification failed' });
    }
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const updates = req.body;
    
    // Handle resume text separately due to potential size
    if (updates.resume) {
      // Validate resume isn't too large
      if (updates.resume.length > 100000) {
        return res.status(400).json({ 
          error: 'Resume text is too large', 
          message: 'Please upload a smaller resume or reduce the content'
        });
      }
      
      updates.resume = updates.resume.toString();
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'email', 'age', 'jobTitle', 'resume', 'preferences'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});
    
    console.log('Applying updates:', validUpdates);
    
    // Use direct update to avoid validation issues
    try {
      const result = await User.updateOne(
        { _id: userId },
        { $set: validUpdates }
      );
      
      console.log('Update result:', result);
      
      // Get the updated user
      const updatedUser = await User.findById(userId).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found after update' });
      }
      
      console.log('User updated successfully');
      res.json(updatedUser);
    } catch (updateError) {
      console.error('Update operation error:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message || 'Failed to update profile'
    });
  }
});

// Protected routes below this line
router.use(auth);

// Update user (generic route)
router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export { router as userRouter }; 