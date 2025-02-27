import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export enum QueryType {
  GENERAL = 'general',
  COMPANY_INFO = 'company_info',
  JOB_RECOMMENDATION = 'job_recommendation',
}

export async function classifyQuery(query: string): Promise<QueryType> {
  // For direct job recommendation requests, bypass the AI classifier
  const jobRecommendationPatterns = [
    /recommend.*job/i,
    /job.*recommendation/i,
    /suitable.*job/i,
    /job.*match/i,
    /career.*match/i,
    /job.*for me/i,
    /what.*job/i,
    /find.*job/i,
    /suggest.*job/i,
    /job.*suggestion/i,
    /job.*fit/i,
    /career.*fit/i,
    /job.*opportunity/i,
    /job.*based on.*resume/i,
    /job.*based on.*skill/i,
    /job.*based on.*experience/i
  ];

  // Check if query matches any job recommendation patterns
  if (jobRecommendationPatterns.some(pattern => pattern.test(query))) {
    console.log("Direct match for job recommendation pattern");
    return QueryType.JOB_RECOMMENDATION;
  }

  // Otherwise, use the AI classifier
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
Classify the following user query into one of these categories:
1. company_info: Questions about specific companies, their culture, interview process, etc.
2. job_recommendation: Questions about job recommendations, career advice, or finding suitable jobs based on skills/resume.
3. general: Any other general questions.

User query: "${query}"

Return only one of these values without explanation: company_info, job_recommendation, or general.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().toLowerCase();
    
    if (text.includes('company_info')) {
      return QueryType.COMPANY_INFO;
    } else if (text.includes('job_recommendation')) {
      return QueryType.JOB_RECOMMENDATION;
    } else {
      return QueryType.GENERAL;
    }
  } catch (error) {
    console.error('Error classifying query:', error);
    return QueryType.GENERAL;
  }
} 