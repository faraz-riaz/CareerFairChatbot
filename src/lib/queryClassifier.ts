import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export type QueryType = 'general_faq' | 'company_info' | 'job_recommendation';

export async function classifyQuery(query: string): Promise<QueryType> {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Classify this user query into one of these categories:
- general_faq: General questions about the career fair, event details, or career advice
- company_info: Specific questions about a company, booth location, or company offerings
- job_recommendation: Questions about job matches or career recommendations

Respond with ONLY the category name, nothing else.

Query: "${query}"`;

  const result = await model.generateContent(prompt);
  const classification = result.response.text().trim().toLowerCase() as QueryType;
  return classification;
} 