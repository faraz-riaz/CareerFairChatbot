import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  category: { type: String, required: true },
  job_title: { type: String, required: true },
  job_description: { type: String, required: true },
  Company: { type: String, required: true, ref: 'Company.Company' }
}, { timestamps: true });

export const Job = mongoose.model('Job', jobSchema); 