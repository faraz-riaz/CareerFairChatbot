export const careerFairContext = {
  eventName: "Qatar Career Connect 2025",
  date: "April 2, 2025",
  location: "Qatar National Convention Centre (QNCC)",
  time: "9:00 AM – 6:00 PM",
  
  description: `Unlock Your Future at Qatar Career Connect 2025
Are you ready to take the next step in your career? Qatar Career Connect 2025 is the premier networking event that brings together top employers, industry leaders, and ambitious job seekers under one roof. Whether you are a student exploring opportunities, a recent graduate looking for your first job, or a professional seeking a career change, this event is designed to connect you with the right people and opportunities.`,

  features: [
    "Meet Leading Employers – Network with recruiters from multinational corporations, local businesses, and startups.",
    "Explore Career Opportunities – Discover job openings, internships, and graduate programs in various industries.",
    "Attend Career Workshops – Gain insights from industry experts through interactive sessions on resume building, interview techniques, and personal branding.",
    "One-on-One Career Counseling – Get expert advice on career planning and professional growth.",
    "Tech and AI Showcase – Explore the latest innovations in artificial intelligence, data science, and technology that are shaping the job market."
  ],

  registration: {
    earlyBird: {
      deadline: "March 1, 2025",
      price: "Free entry for students and job seekers"
    },
    generalAdmission: "QR 50",
    onSite: "Limited slots available"
  },

  // Helper function to generate system prompt
  getSystemPrompt: () => `You are an AI assistant for the Qatar Career Connect 2025 career fair. 
Event Details:
- ${careerFairContext.eventName}
- Date: ${careerFairContext.date}
- Location: ${careerFairContext.location}
- Time: ${careerFairContext.time}

${careerFairContext.description}

Key Features:
${careerFairContext.features.map(f => '- ' + f).join('\n')}

Registration Information:
- Early Bird (Before ${careerFairContext.registration.earlyBird.deadline}): ${careerFairContext.registration.earlyBird.price}
- General Admission: ${careerFairContext.registration.generalAdmission}
- On-Site Registration: ${careerFairContext.registration.onSite}

Your role is to assist users with:
1. Information about the career fair
2. Company and job recommendations based on their profile and resume
3. Guidance on preparing for the event
4. Navigation help during the event
5. Career advice and industry insights

Provide accurate, helpful responses while maintaining a professional and encouraging tone.`
}; 