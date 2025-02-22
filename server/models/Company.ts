import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  Industry: { type: String, required: true },
  Company: { type: String, required: true, unique: true },
  booth_location: { type: String, required: true },
  recruiting_for: [{ type: String, required: true }],
  special_event: { type: String, default: null },
  accepting_resumes: { type: Boolean, required: true },
  interview_slots_available: { type: Number, required: true, default: 0 },
  refreshments_provided: { type: Boolean, required: true, default: false }
}, { timestamps: true });

export const Company = mongoose.model('Company', companySchema); 