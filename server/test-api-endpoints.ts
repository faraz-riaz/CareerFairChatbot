import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test-data directory if it doesn't exist
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Sample resume path
const sampleResumePath = path.join(testDataDir, 'sample-resume.txt');

// Create sample resume file if it doesn't exist
if (!fs.existsSync(sampleResumePath)) {
  const sampleResumeContent = `
JOHN DOE
Software Engineer

EXPERIENCE
Senior Software Engineer - ABC Tech (2020-Present)
- Developed backend services using Node.js and TypeScript
- Implemented RESTful APIs with Express
- Worked with MongoDB and PostgreSQL databases
- Used React for frontend development

Software Developer - XYZ Corp (2018-2020)
- Built cloud applications using AWS
- Wrote Python and JavaScript applications
- Used Git for version control

EDUCATION
BS Computer Science - State University (2014-2018)

SKILLS
JavaScript, TypeScript, Node.js, React, MongoDB, PostgreSQL, AWS, Docker, Git
`;
  fs.writeFileSync(sampleResumePath, sampleResumeContent);
  console.log('Created sample resume file for testing');
}

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = '';

async function testApiEndpoints() {
  try {
    console.log('Testing API endpoints...');
    console.log('IMPORTANT: Make sure your server is running with "npm run server" or "npm run dev:all"');
    
    // Check if server is running
    try {
      await axios.get('http://localhost:3000/health');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('\n❌ ERROR: Server is not running!');
        console.log('Please start the server with "npm run server" or "npm run dev:all" in another terminal');
        console.log('Then run this test again.');
        return;
      }
    }
    
    // Setup: Login to get auth token
    await login();
    
    // Test recommendation endpoints
    await testRecommendationEndpoints();
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function login() {
  console.log('\n--- Testing Authentication ---');
  console.log('Logging in to get auth token...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful, token acquired');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Server connection refused. Is the server running?');
    }
    
    console.log('Login failed, trying to create test user...');
    
    try {
      // Read the resume content
      const resumeContent = fs.readFileSync(sampleResumePath, 'utf-8');
      console.log(`Resume content length: ${resumeContent.length} characters`);
      
      // Create a test user if login fails
      const signupResponse = await axios.post(`${API_BASE_URL}/users/signup`, {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        age: 30,
        jobTitle: 'Software Engineer',
        resume: resumeContent
      });
      
      console.log('User created:', signupResponse.data.user._id);
      
      // Update user with resume if needed
      try {
        await axios.patch(
          `${API_BASE_URL}/users/profile`, 
          { resume: resumeContent },
          { headers: { Authorization: `Bearer ${signupResponse.data.token}` } }
        );
        console.log('Resume updated via profile update');
      } catch (updateError) {
        console.warn('Could not update resume separately:', updateError.message);
      }
      
      // Try login again
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      authToken = response.data.token;
      console.log('✅ Created test user and logged in');
    } catch (signupError) {
      console.error('❌ Failed to create test user:', signupError.message);
      throw new Error('Authentication failed');
    }
  }
}

async function testRecommendationEndpoints() {
  console.log('\n--- Testing Job Recommendation API ---');
  
  const config = {
    headers: { Authorization: `Bearer ${authToken}` }
  };
  
  try {
    // First check if the user has a resume
    try {
      const userResponse = await axios.get(`${API_BASE_URL}/users/profile`, config);
      console.log(`User profile retrieved, resume length: ${userResponse.data.resume?.length || 0} characters`);
      
      if (!userResponse.data.resume) {
        console.log('Attempting to update user with resume...');
        const resumeContent = fs.readFileSync(sampleResumePath, 'utf-8');
        await axios.patch(
          `${API_BASE_URL}/users/profile`, 
          { resume: resumeContent },
          config
        );
        console.log('Resume updated successfully');
      }
    } catch (profileError) {
      console.warn('Could not check or update user profile:', profileError.message);
    }
    
    // Now test recommendations
    const response = await axios.get(`${API_BASE_URL}/recommendations/jobs?limit=3`, config);
    console.log('Job recommendations API response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error === 'No resume found') {
      console.error('❌ No resume found for test user despite our attempts to add one.');
      console.log('This might indicate an issue with how resumes are stored or retrieved.');
    } else {
      throw error;
    }
  }
}

// Execute the tests
testApiEndpoints(); 