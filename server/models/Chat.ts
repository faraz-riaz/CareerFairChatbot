import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, required: true },
});

const chatSchema = new mongoose.Schema({
  title: { type: String, required: true },
  messages: [messageSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Number, required: true },
}, { timestamps: true });

export const Chat = mongoose.model('Chat', chatSchema); 