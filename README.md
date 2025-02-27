# Career Fair Chat

A smart AI-powered platform that helps job seekers find tailored job recommendations based on their resumes and engage with a career assistant chatbot.

## Features

- **Smart AI Chat Assistant**: Interact with an AI assistant that can answer career questions and provide job recommendations
- **Resume Parsing**: Upload your resume in PDF format to get personalized job recommendations
- **Job Matching**: View jobs that match your skills and experience with percentage-based matching scores
- **User Profiles**: Manage your personal information and preferences
- **Dark Mode Support**: Switch between light and dark themes for comfortable viewing

## Technologies Used

### Frontend
- React
- TypeScript
- TailwindCSS
- Lucide Icons
- PDF.js for client-side PDF processing
- React Markdown for chat message rendering

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- Vector embeddings for job matching
- PDF processing with poppler-utils

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- poppler-utils (for server-side PDF processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/career-fair-chat.git
   cd career-fair-chat
   ```

2. Install dependencies for both frontend and backend
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   ```

3. Configure environment variables
   Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/career-fair-chat
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. Start the development servers
   ```bash
   # Start backend server (from server directory)
   npm run dev
   
   # Start frontend development server (from root directory)
   npm start
   ```

   or

   ```bash
   npm run server
   npm run dev
   ```

   or 

   ```bash
   npm run dev:all
   ```

## Usage

1. Create an account or log in
2. Upload your resume in PDF format from your profile
3. Interact with the AI assistant for career advice
4. View personalized job recommendations based on your resume
5. Update your profile information as needed
