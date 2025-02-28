import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'You are not logged in' });
  }

  const accessToken = authHeader.split(' ')[1];

  jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', (err: jwt.VerifyErrors | null, payload: any) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Need to login again' });
    }

    if (!payload || !payload.userId) {
      return res.status(403).json({ status: 'error', message: 'Invalid token' });
    }

    req.userId = payload.id;

    console.log('authentication payload: ', payload);
    next();
  });
};
