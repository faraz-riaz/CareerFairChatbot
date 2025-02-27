import { Job } from '../models/Job';
import { createJobsIndex, isIndexInitialized } from './embeddingService';

export async function initializeServices() {
  try {
    console.log('Initializing services...');
    
    // Initialize job embeddings index
    await initializeJobIndex();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    // Don't crash the server, but log the error
  }
}

async function initializeJobIndex() {
  try {
    console.log('Initializing job embeddings index...');
    
    // Skip if already initialized
    if (isIndexInitialized()) {
      console.log('Job index already initialized');
      return;
    }
    
    // Get all jobs from the database
    const jobs = await Job.find({});
    
    if (jobs.length === 0) {
      console.log('No jobs found in database. Job index will be created when jobs are added.');
      return;
    }
    
    // Create the job index - this will also cache it globally
    await createJobsIndex(jobs);
    console.log(`Job index created and cached with ${jobs.length} jobs`);
  } catch (error) {
    console.error('Error initializing job index:', error);
    throw error;
  }
} 