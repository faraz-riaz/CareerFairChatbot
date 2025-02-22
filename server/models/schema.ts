import { Schema } from 'mongoose';

// User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  jobTitle: { type: String, required: true },
  resume: { type: String, required: false },
  rawResume: { type: String, required: false }
}, { timestamps: true });

// Chat Schema
const messageSchema = new Schema({
  role: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, required: true }
});

const chatSchema = new Schema({
  title: { type: String, required: true },
  messages: [messageSchema],
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Number, required: true }
}, { timestamps: true });

// Company Schema
const companySchema = new Schema({
  Industry: { type: String, required: true },
  Company: { type: String, required: true, unique: true },
  booth_location: { type: String, required: true },
  recruiting_for: [{ type: String, required: true }],
  special_event: { type: String, default: null },
  accepting_resumes: { type: Boolean, required: true },
  interview_slots_available: { type: Number, required: true, default: 0 },
  refreshments_provided: { type: Boolean, required: true, default: false }
}, { timestamps: true });

// Job Schema
const jobSchema = new Schema({
  category: { type: String, required: true },
  job_title: { type: String, required: true },
  job_description: { type: String, required: true },
  Company: { type: String, required: true, ref: 'Company.Company' }
}, { timestamps: true });

// TypeScript Interfaces
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  age: number;
  jobTitle: string;
  resume?: string;
  rawResume?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

export interface IChat {
  _id: string;
  title: string;
  messages: IMessage[];
  userId: string;
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany {
  _id: string;
  Industry: string;
  Company: string;
  booth_location: string;
  recruiting_for: string[];
  special_event: string | null;
  accepting_resumes: boolean;
  interview_slots_available: number;
  refreshments_provided: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJob {
  _id: string;
  category: string;
  job_title: string;
  job_description: string;
  Company: string;
  createdAt: Date;
  updatedAt: Date;
}

// Export schemas
export {
  userSchema,
  chatSchema,
  companySchema,
  jobSchema
}; 