import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing Gemini API key');
}

export async function initializeGemini() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    return genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
  } catch (error) {
    console.error('Failed to initialize Gemini:', error);
    throw new Error('Failed to initialize AI model. If you are using an ad blocker, please disable it for this site.');
  }
}

export const model = await initializeGemini();