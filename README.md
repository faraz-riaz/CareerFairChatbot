# Career Fair Chat

A modern web application that combines AI-powered chat assistance with resume management for career guidance.

## Features

### AI Chat Assistant
- Real-time conversation with an AI powered by Google's Gemini API
- Context-aware responses for career-related questions
- Markdown support for formatted responses
- Typewriter effect for bot responses
- Chat history management

### Resume Management
- PDF resume upload and processing
- Automatic resume classification into structured categories:
  - Experience
  - Education
  - Projects
  - Skills
  - Certifications
- Clean, organized display of resume information
- Storage of both raw and classified resume text

### User Management
- Secure authentication system
- Profile management
- Password change functionality
- Dark/Light theme support
- Account deletion option

## Technology Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- PDF.js for PDF processing
- React Markdown for formatted text
- Lucide React for icons
- Context API for state management

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing

### AI/ML
- Google Gemini API for:
  - Chat responses
  - Resume classification

### Development Tools
- Vite for build tooling
- ESLint for code quality
- Environment variables management
- Concurrent server/client development setup

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Start the development servers:
```bash
npm run dev:all
```

## Architecture

The application follows a modern React architecture with:
- Component-based structure
- Context-based state management
- TypeScript for type safety
- REST API communication
- JWT-based authentication
- Responsive design
- Dark mode support

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected API routes
- Secure password change mechanism
- PDF to text conversion for secure storage

## Future Enhancements

- Resume comparison with job descriptions
- Career path recommendations
- Interview preparation features
- Skills gap analysis
- Job market insights