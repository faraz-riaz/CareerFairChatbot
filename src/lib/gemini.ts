import { GoogleGenerativeAI } from '@google/generative-ai';
import { careerFairContext } from './eventContext';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing Gemini API key');
}

export async function initializeGemini() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    return genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
  } catch (error: any) {
    console.error('Gemini Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw error;
  }
}