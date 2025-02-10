import express from 'express';
import { Chat } from '../models/Chat';
import { auth } from '../middleware/auth';

const router = express.Router();

// Protect all chat routes
router.use(auth);

// Get all chats for user
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.userId });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new chat
router.post('/', async (req, res) => {
  try {
    const chat = new Chat({
      ...req.body,
      userId: req.user.userId
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update chat
router.patch('/:id', async (req, res) => {
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true }
    );
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete chat
router.delete('/:id', async (req, res) => {
  try {
    await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export { router as chatRouter }; 