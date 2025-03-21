import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { Ristriction } from '@/api/entity/ristrictions/Ristriction';
import { AppDataSource } from '@/server';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// export interface AuthenticatedRequest extends Request {
//   userId?: string;
// }

// export const authenticate = (req: AuthenticatedRequest, res: Response, next: () => void) => {
//   const authHeader = req.headers['authorization'];

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ status: 'error', message: 'You are not logged in' });
//   }

//   const accessToken = authHeader.split(' ')[1];

//   jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', (err: jwt.VerifyErrors | null, payload: any) => {
//     if (err) {
//       return res.status(403).json({ status: 'error', message: 'Need to login again' });
//     }

//     if (!payload || !payload.id) {
//       return res.status(403).json({ status: 'error', message: 'Invalid token' });
//     }

//     req.userId = payload.id;

//     console.log('authentication payload: ', payload);
//     next();
//   });
// };

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'You are not logged in' });
  }

  const accessToken = authHeader.split(' ')[1];

  jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', (err, payload: any) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Need to login again' });
    }

    if (!payload || !payload.id) {
      return res.status(403).json({ status: 'error', message: 'Invalid token' });
    }

    // Explicitly cast req as AuthenticatedRequest to allow adding userId
    (req as AuthenticatedRequest).userId = payload.id;

    console.log('authentication payload: ', payload);
    next();
  });
};

export const connectionRestrict = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const restrictionRepo = AppDataSource.getRepository(Ristriction);
    const restriction = await restrictionRepo.findOne({ where: { userId } });

    if (!restriction) {
      return res.status(400).json({ error: "Restriction record not found" });
    }

    if (restriction.connectionCount <= 0) {
      return res.status(403).json({ status: "error", statusCode: 403, message: "We are currently verifying the profiles. Please wait 24h - 48h to send more connection requests." });
    }

    next();
  } catch (error) {
    console.error("Error checking connection limit:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPostRestrict = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authenticatedReq = req as AuthenticatedRequest;
    const userId = authenticatedReq.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const restrictionRepo = AppDataSource.getRepository(Ristriction);
    const restriction = await restrictionRepo.findOne({ where: { userId } });

    if (!restriction) {
      return res.status(400).json({ error: "Restriction record not found" });
    }

    if (!restriction.isBusinessProfileCompleted) {
      return res.status(403).json({ status: "error", statusCode: 403, message: "Please fill your business profile to post your thoughts." });
    }

    next();
  } catch (error) {
    console.error("Error checking connection limit:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

