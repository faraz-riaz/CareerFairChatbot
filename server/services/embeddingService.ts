import { pipeline } from '@xenova/transformers';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

// Fix for ES modules
const require = createRequire(import.meta.url);
const faiss = require('faiss-node');

// Cache for the embedding pipeline
let embeddingPipeline: any = null;

// Global cache for the FAISS index and metadata
// These need to be module-level variables to persist between requests
let GLOBAL_INDEX: any = null;
let GLOBAL_METADATA: any[] = [];
let INDEX_INITIALIZED = false;

// Directory to store FAISS indexes
const indexDir = path.join(process.cwd(), 'server', 'indexes');
if (!fs.existsSync(indexDir)) {
  fs.mkdirSync(indexDir, { recursive: true });
}

const INDEX_PATH = path.join(indexDir, 'jobs_index.faiss');
const METADATA_PATH = path.join(indexDir, 'jobs_metadata.json');

// Initialize the embedding model
export async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Initializing embedding model...');
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
}

// Create text embeddings
export async function createEmbedding(text: string): Promise<Float32Array> {
  const pipe = await getEmbeddingPipeline();
  const result = await pipe(text, { pooling: 'mean', normalize: true });
  return result.data;
}

// FAISS Index management
export async function createJobsIndex(jobs: any[], forceRebuild = false) {
  // If we already have an initialized index and aren't forcing a rebuild, return it
  if (INDEX_INITIALIZED && GLOBAL_INDEX && GLOBAL_METADATA.length > 0 && !forceRebuild) {
    console.log(`Using existing cached index with ${GLOBAL_METADATA.length} jobs`);
    return { index: GLOBAL_INDEX, metadata: GLOBAL_METADATA };
  }

  // Generate embeddings for all jobs
  console.log('Generating embeddings for jobs...');
  const embeddings: Float32Array[] = [];
  const metadata: any[] = [];

  for (const job of jobs) {
    // Combine job title and description for better context
    const jobText = `${job.job_title} ${job.job_description}`;
    const embedding = await createEmbedding(jobText);
    embeddings.push(embedding);
    
    // Store job data without the description (for efficiency)
    metadata.push({
      _id: job._id.toString(),
      job_title: job.job_title,
      category: job.category,
      Company: job.Company,
      job_description: job.job_description // Include description for chat responses
    });
  }

  // Create FAISS index
  console.log('Creating FAISS index...');
  const dimension = embeddings[0].length;
  const index = new faiss.IndexFlatL2(dimension);
  
  // Convert embeddings to the format expected by faiss-node
  // Create a flat array of all embedding values
  const flatEmbeddings = new Float32Array(embeddings.length * dimension);
  
  // Copy each embedding into the flat array
  for (let i = 0; i < embeddings.length; i++) {
    flatEmbeddings.set(embeddings[i], i * dimension);
  }
  
  // Convert Float32Array to regular JavaScript array for faiss-node
  const embeddingsArray = Array.from(flatEmbeddings);
  
  // Add the embeddings to the index
  index.add(embeddingsArray);
  
  // Save index to disk
  index.write(INDEX_PATH);
  
  // Save metadata separately
  fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata));
  
  // Update global cache
  GLOBAL_INDEX = index;
  GLOBAL_METADATA = metadata;
  INDEX_INITIALIZED = true;
  
  console.log(`Index created with ${embeddings.length} job vectors`);
  return { index, metadata };
}

// Load or create index
export async function getJobsIndex(jobs?: any[]) {
  // If we already have an initialized index, return it
  if (INDEX_INITIALIZED && GLOBAL_INDEX && GLOBAL_METADATA.length > 0) {
    console.log(`Using global cached index with ${GLOBAL_METADATA.length} jobs`);
    return { index: GLOBAL_INDEX, metadata: GLOBAL_METADATA };
  }
  
  // If we have existing index files and no jobs were provided to create a new index
  if (fs.existsSync(INDEX_PATH) && fs.existsSync(METADATA_PATH) && !jobs) {
    try {
      // Load metadata
      const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
      console.log('Loaded metadata from disk with', metadata.length, 'jobs');
      
      // For faiss-node, we need to rebuild the index from scratch
      // Get all jobs from database to rebuild the index
      const mongoose = require('mongoose');
      const Job = mongoose.model('Job');
      const allJobs = await Job.find({});
      
      console.log(`Building index from ${allJobs.length} jobs...`);
      return createJobsIndex(allJobs);
    } catch (error) {
      console.error('Error loading index:', error);
      if (!jobs) {
        throw new Error('Failed to load index and no jobs provided to create a new one');
      }
      return createJobsIndex(jobs);
    }
  } else if (jobs) {
    // Create new index with provided jobs
    return createJobsIndex(jobs);
  } else {
    throw new Error('No jobs provided and no existing index found');
  }
}

// Search for similar jobs
export async function findSimilarJobs(resumeText: string, topK: number = 5) {
  // Get the embedding for the resume
  const resumeEmbedding = await createEmbedding(resumeText);
  
  // Get the index (should be cached after first use)
  const { index, metadata } = await getJobsIndex();
  
  // Search index
  const searchVector = Array.from(resumeEmbedding);
  const result = index.search(searchVector, topK);
  
  // Get matching job IDs and create recommendations with scores
  const recommendations = result.labels
    .map((label: number, i: number) => {
      if (label < 0 || label >= metadata.length) return null;
      
      return {
        ...metadata[label],
        score: 1 / (1 + result.distances[i])  // Convert distance to similarity score (0-1)
      };
    })
    .filter(Boolean); // Remove null entries
  
  return recommendations;
}

// Export a function to check if the index is initialized
export function isIndexInitialized() {
  return INDEX_INITIALIZED;
} 