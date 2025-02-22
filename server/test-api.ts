import mongoose from 'mongoose';
import { Company } from './models/Company';
import { generateMongoQuery } from '../src/lib/companyQueries';
import dotenv from 'dotenv';

dotenv.config();

async function testAPI(userQuery: string) {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/career-fair-chat');
    console.log('Connected to MongoDB\n');

    // Generate MongoDB query from user's chat message
    console.log('User Query:', userQuery);
    const mongoQueryString = await generateMongoQuery(userQuery);
    console.log('Generated MongoDB Query:', mongoQueryString);

    // Execute the query
    const queryObj = JSON.parse(mongoQueryString);
    const results = await Company.find(queryObj);
    console.log('\nQuery Results:', JSON.stringify(results, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Test with different queries
const testQueries = [
  "Where is the booth for Goldman Sachs?",
  "Show me companies that are accepting resumes",
  "Where is DeepMind's booth located?",
  "Which companies have interview slots available?"
];

// Run test for first query (can change index to test different queries)
testAPI(testQueries[0]); 