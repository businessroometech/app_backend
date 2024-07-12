import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: () => void) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ status: 'error', message: 'you are not logged in' });
  }

  jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', (err: jwt.VerifyErrors | null, payload: any) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Need to login again' });
    }
    console.log('authentication payload: ', payload);
    next();
  });
};
