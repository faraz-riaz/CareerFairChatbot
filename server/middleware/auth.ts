import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend the Request type to include user field
declare global {
  namespace Express {
    interface Request {
      user: any;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
      
      // Add debugging info
      console.log('Decoded token:', decoded);
      
      // Set user on request object
      req.user = decoded;
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Please authenticate' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}; 