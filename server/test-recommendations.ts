import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from './models/Job';
import { User } from './models/User';
import { createJobsIndex, findSimilarJobs } from './services/embeddingService';

dotenv.config();

// Sample resume text for testing
const sampleResumes = {
  software_engineer: `
    EXPERIENCE
    Senior Software Engineer - Google (2020-Present)
    - Developed backend services using Node.js and TypeScript
    - Implemented RESTful APIs with Express
    - Worked with MongoDB and PostgreSQL databases
    - Used React for frontend development
    
    Software Developer - Microsoft (2018-2020)
    - Built cloud applications using Azure
    - Wrote C# and .NET Core applications
    - Used Git for version control
    
    EDUCATION
    BS Computer Science - Stanford University (2014-2018)
    
    SKILLS
    JavaScript, TypeScript, Node.js, React, MongoDB, PostgreSQL, AWS, Azure, Docker
  `,
  
  data_scientist: `
    EXPERIENCE
    Data Scientist - Amazon (2019-Present)
    - Built machine learning models for product recommendations
    - Used Python, PyTorch, and scikit-learn
    - Performed data analysis and visualization
    - Worked with big data using Spark
    
    Junior Data Analyst - IBM (2017-2019)
    - Created dashboards using Tableau
    - Analyzed customer behavior data
    - SQL database queries and data extraction
    
    EDUCATION
    MS Data Science - MIT (2015-2017)
    BS Statistics - UC Berkeley (2011-2015)
    
    SKILLS
    Python, R, SQL, Machine Learning, Deep Learning, PyTorch, TensorFlow, Pandas, NumPy
  `,
  
  marketing: `
    EXPERIENCE
    Marketing Manager - Apple (2020-Present)
    - Led digital marketing campaigns
    - Managed social media presence
    - Created content marketing strategies
    - Analyzed customer engagement metrics
    
    Marketing Associate - Nike (2018-2020)
    - Assisted with email marketing campaigns
    - Helped organize promotional events
    - Created marketing materials
    
    EDUCATION
    MBA Marketing - Columbia University (2016-2018)
    BA Communication - NYU (2012-2016)
    
    SKILLS
    Digital Marketing, Social Media, SEO, Content Marketing, Google Analytics, Adobe Creative Suite
  `
};

async function testRecommendations() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/career-fair-chat');
    console.log('Connected to MongoDB\n');

    // Ensure we have some jobs in the database
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      console.log('No jobs found in database. Adding sample jobs...');
      await seedSampleJobs();
    } else {
      console.log(`Found ${jobCount} jobs in database`);
    }

    // Build index
    console.log('Building job index...');
    const jobs = await Job.find({});
    await createJobsIndex(jobs);

    // Test recommendations for each resume type
    for (const [type, resumeText] of Object.entries(sampleResumes)) {
      console.log(`\n--- Testing recommendations for ${type} ---`);
      const recommendations = await findSimilarJobs(resumeText, 3);
      
      console.log(`Top 3 job recommendations:`);
      for (const rec of recommendations) {
        const job = await Job.findById(rec._id);
        console.log(`- ${job.job_title} at ${job.Company} (Score: ${rec.score.toFixed(2)})`);
        console.log(`  Category: ${job.category}`);
        console.log(`  Match score: ${(rec.score * 100).toFixed(1)}%`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function seedSampleJobs() {
  // Sample jobs across different fields
  const sampleJobs = [
    {
      category: 'Technology',
      job_title: 'Senior Software Engineer',
      job_description: 'Design and develop high-quality software solutions using Node.js, TypeScript, and React. Experience with MongoDB and cloud services required.',
      Company: 'Google'
    },
    {
      category: 'Technology',
      job_title: 'Frontend Developer',
      job_description: 'Create responsive user interfaces using React, Redux, and modern CSS frameworks. Experience with web performance optimization desired.',
      Company: 'Facebook'
    },
    {
      category: 'Technology',
      job_title: 'Data Engineer',
      job_description: 'Build data pipelines and ETL processes using Python, Spark, and SQL. Experience with big data technologies and cloud platforms required.',
      Company: 'Amazon'
    },
    {
      category: 'Data Science',
      job_title: 'Machine Learning Engineer',
      job_description: 'Develop and deploy machine learning models using PyTorch or TensorFlow. Strong background in statistics and mathematics required.',
      Company: 'DeepMind'
    },
    {
      category: 'Data Science',
      job_title: 'Data Scientist',
      job_description: 'Analyze complex datasets using Python, R, and SQL. Experience with statistical modeling and visualization tools required.',
      Company: 'IBM'
    },
    {
      category: 'Marketing',
      job_title: 'Digital Marketing Manager',
      job_description: 'Plan and execute digital marketing campaigns across multiple channels. Experience with SEO, SEM, and analytics tools required.',
      Company: 'Apple'
    },
    {
      category: 'Marketing',
      job_title: 'Brand Strategist',
      job_description: 'Develop and implement brand strategies to increase market presence. Experience with market research and consumer behavior analysis required.',
      Company: 'Nike'
    },
    {
      category: 'Finance',
      job_title: 'Financial Analyst',
      job_description: 'Perform financial modeling and analysis to support business decisions. Experience with Excel, financial statements, and forecasting required.',
      Company: 'Goldman Sachs'
    },
    {
      category: 'Finance',
      job_title: 'Investment Banking Associate',
      job_description: 'Support mergers, acquisitions, and capital raising activities. Strong financial modeling and valuation skills required.',
      Company: 'Morgan Stanley'
    }
  ];

  await Job.insertMany(sampleJobs);
  console.log(`Added ${sampleJobs.length} sample jobs to database`);
}

testRecommendations(); 