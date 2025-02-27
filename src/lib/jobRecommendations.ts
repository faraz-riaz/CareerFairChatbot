import { recommendations } from './api';

export async function getJobRecommendationsForChat(query: string) {
  try {
    console.log("Getting job recommendations for query:", query);
    
    // Get job recommendations from the API
    const jobs = await recommendations.getJobRecommendations(5);
    console.log("Received job recommendations:", jobs);
    
    if (!jobs || jobs.length === 0) {
      return "I couldn't find any job recommendations based on your resume. Please make sure you've uploaded your resume in your profile.";
    }
    
    // Format the recommendations as a chat message
    let response = "Based on your resume, I've found these job matches for you:\n\n";
    
    jobs.forEach((job, index) => {
      const matchPercentage = Math.round(job.score * 100);
      response += `**${index + 1}. ${job.job_title} at ${job.Company}** (${matchPercentage}% match)\n`;
      response += `**Category:** ${job.category}\n`;
      
      // Truncate description if needed
      const description = job.job_description || "No description available";
      const truncatedDescription = description.length > 150 
        ? description.substring(0, 150) + "..." 
        : description;
        
      response += `**Description:** ${truncatedDescription}\n\n`;
    });
    
    response += "Would you like more details about any of these positions?";
    
    return response;
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return "I'm sorry, I couldn't retrieve job recommendations at this time. Please make sure you've uploaded your resume in your profile.";
  }
} 