import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET) as any;
    const user = await User.findByPk(decoded.id) as any;
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    (req as any).user = user;
    (req as any).companyId = user.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};
