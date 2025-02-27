import express from 'express';
import { auth } from '../middleware/auth';
import { Company } from '../models/Company';

const router = express.Router();

// Protect all company routes
router.use(auth);

// Query companies based on a MongoDB query string
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Received request body:', req.body);
    
    // Clean up the query string - remove markdown formatting if present
    let cleanQuery = query;
    if (typeof query === 'string') {
      // Remove markdown code block formatting if present
      cleanQuery = query.replace(/```json\n|\n```/g, '');
      console.log('Cleaned query:', cleanQuery);
    }
    
    // Parse the query
    let parsedQuery;
    try {
      parsedQuery = typeof cleanQuery === 'string' ? JSON.parse(cleanQuery) : cleanQuery;
    } catch (parseError) {
      console.error('Query parse error:', parseError, 'Query was:', query);
      console.log('Cleaned query was:', cleanQuery);
      return res.status(400).json({ 
        error: 'Invalid query format', 
        details: parseError.message,
        receivedQuery: query
      });
    }
    
    // Execute the query
    const companies = await Company.find(parsedQuery).limit(10);
    res.json(companies);
  } catch (error) {
    console.error('Company query error:', error);
    res.status(500).json({ 
      error: 'Failed to query companies', 
      details: error.message 
    });
  }
});

// Get all companies
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({});
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Get company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

export { router as companyRouter }; 