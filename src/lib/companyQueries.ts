import { GoogleGenerativeAI } from '@google/generative-ai';

// Use import.meta.env for frontend code
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing Gemini API key in environment variables');
}

const SCHEMA_INFO = `
Database Schemas:

companies Collection:
{
  Industry: String,          // Company's industry sector
  Company: String,          // Unique company name
  booth_location: String,   // Location at the career fair
  recruiting_for: [String], // Target experience levels
  special_event: String,    // Special events or presentations
  accepting_resumes: Boolean, // Whether accepting resumes
  interview_slots_available: Number, // Available interview slots
  refreshments_provided: Boolean // Refreshments availability
}

jobs Collection:
{
  category: String,         // Job category/field
  job_title: String,       // Position title
  job_description: String, // Detailed job description
  Company: String          // Associated company name (references Companies.Company)
}`;

export async function generateMongoQuery(query: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `${SCHEMA_INFO}

Based on this user query, generate a MongoDB query string to fetch relevant company and/or job information.
Only return the query string, no explanation.
Example queries:
- { "Company": "DeepMind" }
- { "Industry": "Technology - Artificial Intelligence" }
- { "booth_location": "H1" }
- { "accepting_resumes": true, "interview_slots_available": { "$gt": 0 } }
- { "category": "Technology - Artificial Intelligence", "job_title": { "$regex": "Research", "$options": "i" } }

Query: "${query}"`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
} 