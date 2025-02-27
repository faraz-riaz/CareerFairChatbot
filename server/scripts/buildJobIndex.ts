import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from '../models/Job';
import { createJobsIndex } from '../services/embeddingService';

dotenv.config();

async function buildIndex() {
  try {
    await mongoose.connect('mongodb://localhost:27017/career-fair-chat');
    console.log('Connected to MongoDB');

    const jobs = await Job.find({});
    console.log(`Found ${jobs.length} jobs in database`);

    if (jobs.length === 0) {
      console.log('No jobs found. Please add jobs to the database first.');
      return;
    }

    await createJobsIndex(jobs);
    console.log('Job index created successfully');
  } catch (error) {
    console.error('Error building index:', error);
  } finally {
    await mongoose.disconnect();
  }
}

buildIndex(); 