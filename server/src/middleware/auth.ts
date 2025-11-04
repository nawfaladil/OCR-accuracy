import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.session && (req.session as any).userId) {
    req.userId = (req.session as any).userId;
    req.username = (req.session as any).username;
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.session && (req.session as any).userId) {
    req.userId = (req.session as any).userId;
    req.username = (req.session as any).username;
  }
  next();
};
