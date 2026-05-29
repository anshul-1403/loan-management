import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. Please provide a token in the format "Bearer <token>".' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'credisea_super_secret_jwt_key_987654321') as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found or token is invalid.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.', error: (error as Error).message });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    if (roles.includes('Admin') && req.user.role === 'Admin') {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        message: `Access denied. Role "${req.user.role}" is unauthorized to access this resources.` 
      });
      return;
    }

    next();
  };
};
