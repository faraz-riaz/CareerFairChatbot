import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execPromise = promisify(exec);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Protect all upload routes
router.use(auth);

// Process PDF and extract text
router.post('/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    try {
      // Use pdftotext (from poppler-utils) to extract text
      // You'll need to install poppler-utils on your server
      const { stdout } = await execPromise(`pdftotext "${filePath}" -`);
      
      // Clean up the file after processing
      fs.unlinkSync(filePath);
      
      res.json({ text: stdout });
    } catch (conversionError) {
      console.error('PDF conversion error:', conversionError);
      
      // Clean up the file if there was an error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      res.status(400).json({ 
        error: 'Failed to extract text from PDF',
        details: conversionError.message
      });
    }
  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF file',
      details: error.message
    });
  }
});

export { router as uploadsRouter }; 