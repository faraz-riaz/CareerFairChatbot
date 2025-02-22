import express from 'express';
import { Company } from '../models/Company';

const router = express.Router();

router.post('/query', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    
    if (!req.body.query) {
      console.log('Missing query in request body');
      return res.status(400).json({ error: 'Query string is required' });
    }

    let queryObj;
    try {
      // If query is already an object, use it directly
      queryObj = typeof req.body.query === 'string' 
        ? JSON.parse(req.body.query) 
        : req.body.query;
      
      console.log('Parsed query object:', queryObj);
    } catch (parseError) {
      console.error('Query parse error:', parseError, 'Query was:', req.body.query);
      return res.status(400).json({ 
        error: 'Invalid query format',
        details: parseError.message,
        receivedQuery: req.body.query
      });
    }

    console.log('Executing MongoDB query:', queryObj);
    const companies = await Company.find(queryObj);
    console.log('Query results:', companies);
    
    res.json(companies);
  } catch (error) {
    console.error('Company query error:', error);
    res.status(500).json({ 
      error: 'Failed to query companies', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export { router as companyRouter }; 