import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { AppDataSource } from '@/server';
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

    if (!payload || !payload.id) {
      return res.status(403).json({ status: 'error', message: 'Invalid token' });
    }

    req.userId = payload.id;

    console.log('authentication payload: ', payload);
    next();
  });
};

// import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
// import { AppDataSource } from '@/server';
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// export interface AuthenticatedRequest extends Request {
//   userId?: string;
//   isAdmin?: boolean;
// }

// export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   try {
//     const authHeader = req.headers['authorization'];

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ status: 'error', message: 'You are not logged in' });
//     }

//     const accessToken = authHeader.split(' ')[1];

//     jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', async (err: jwt.VerifyErrors | null, payload: any) => {
//       if (err) {
//         return res.status(403).json({ status: 'error', message: 'Need to login again' });
//       }

//       if (!payload || !payload.id) {
//         return res.status(403).json({ status: 'error', message: 'Invalid token' });
//       }

//       const userRepo = AppDataSource.getRepository(PersonalDetails);
//       const user = await userRepo.findOne({ where: { id: payload.id } });

//       if (!user) {
//         return res.status(401).json({ status: 'error', message: 'User does not exist' });
//       }

//       req.userId = user.id;
//       req.isAdmin = user.isAdmin || false; 

//       console.log('Authentication payload: ', payload);
//       next();
//     });
//   } catch (error) {
//     console.error('Authentication error:', error);
//     return res.status(500).json({ status: 'error', message: 'Internal server error' });
//   }
// };
