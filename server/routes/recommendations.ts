import express from 'express';
import { auth } from '../middleware/auth';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { findSimilarJobs, getJobsIndex, createJobsIndex } from '../services/embeddingService';

const router = express.Router();

// Protect all recommendation routes
router.use(auth);

// Get job recommendations based on resume
router.get('/jobs', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.resume) {
      return res.status(400).json({ 
        error: 'No resume found', 
        message: 'Please upload your resume to get personalized job recommendations'
      });
    }
    
    // Get top job recommendations
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const recommendations = await findSimilarJobs(user.resume, limit);
    
    // Fetch full job details
    const recommendationIds = recommendations.map(rec => rec._id);
    const jobDetails = await Job.find({ _id: { $in: recommendationIds } });
    
    // Merge details with scores and sort by score
    const result = recommendations.map(rec => {
      const details = jobDetails.find(job => job._id.toString() === rec._id);
      return {
        ...details?.toObject(),
        score: rec.score
      };
    }).sort((a, b) => b.score - a.score);
    
    res.json(result);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ 
      error: 'Failed to get job recommendations', 
      details: error.message
    });
  }
});

// Admin route to build/rebuild the job index
router.post('/build-index', async (req, res) => {
  try {
    // Check admin status (you may want a proper admin check)
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const jobs = await Job.find({});
    if (jobs.length === 0) {
      return res.status(400).json({ error: 'No jobs found in database' });
    }
    
    await createJobsIndex(jobs);
    res.json({ success: true, message: `Index created with ${jobs.length} jobs` });
  } catch (error) {
    console.error('Index build error:', error);
    res.status(500).json({ error: 'Failed to build job index', details: error.message });
  }
});

// Admin route to refresh the job index
router.post('/refresh-index', async (req, res) => {
  try {
    // Check admin status (you may want a proper admin check)
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const jobs = await Job.find({});
    if (jobs.length === 0) {
      return res.status(400).json({ error: 'No jobs found in database' });
    }
    
    await createJobsIndex(jobs);
    res.json({ success: true, message: `Index refreshed with ${jobs.length} jobs` });
  } catch (error) {
    console.error('Index refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh job index', details: error.message });
  }
});

export { router as recommendationRouter }; 