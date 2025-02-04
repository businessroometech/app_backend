import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '@/server';
import { createNotification } from '../notifications/notificationController';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';

const generateAccessToken = (user: { id: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id }, process.env.ACCESS_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_ACCESS_EXPIRES_IN_REMEMBER : process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

const generateRefreshToken = (user: { id: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER : process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

// export const login = async (req: Request, res: Response,): Promise<void> => {
//   try {
//     const { email, password, rememberMe = false } = req.body;

//     // Validate input
//     if (!email || !password) {
//       res.status(400).json({
//         status: 'fail',
//         message: 'Please provide an email and password.',
//       });
//       return;
//     }

//     const userLoginRepository = AppDataSource.getRepository(PersonalDetails);

//     // Find the user by email
//     const user: PersonalDetails | null = await userLoginRepository.findOne({ where: { emailAddress:email } });

//     // Check if user exists and password is valid
//     if (!user || !(await PersonalDetails.validatePassword(password, user.password))) {
//       res.status(401).json({
//         status: 'error',
//         message: 'Invalid email or password.',
//       });
//       return;
//     }

//     // Generate tokens
//     const accessToken = generateAccessToken(user, rememberMe);
//     // const refreshToken = generateRefreshToken(user, rememberMe);

//     // Set refresh token as an HTTP-only cookie
//     // res.cookie('refreshToken', refreshToken, {
//     //   httpOnly: true,
//     //   secure: process.env.NODE_ENV === 'production',
//     //   sameSite: 'strict',
//     //   maxAge: rememberMe
//     //     ? parseInt(process.env.JWT_REFRESH_COOKIE_MAX_AGE_REMEMBER!, 10)
//     //     : parseInt(process.env.JWT_REFRESH_COOKIE_MAX_AGE!, 10),
//     // });

//     // Respond with the access token and user details
//     res.status(200).json({
//       status: 'success',
//       message: 'Logged in successfully.',
//       data: {
//         accessToken,
//         user
//       },
//     });

//     const notificationRepos = AppDataSource.getRepository(Notifications);
//     const notification = notificationRepos.create({
//       userId: user.id,
//       message: 'Welcome to our platform!, You have successfully logged in',
//       navigation: '/',
//     });

//     // Save the notification
//     await notificationRepos.save(notification);

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong! Please try again later.',
//     });
//   }
// };

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const { token } = req.query;

    if (!email || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide an email and password.',
      });
      return;
    }

    const userLoginRepository = AppDataSource.getRepository(PersonalDetails);
    let user: PersonalDetails | null = null;

    if (token) {
      // Handle token-based verification
      let payload: any;
      try {
        payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
      } catch (err) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid or expired token.',
        });
        return;
      }

      const { userId } = payload;
      user = await userLoginRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found.',
        });
        return;
      }

      if (user.active === 0) {
        user.active = 1; // Activate user
        await userLoginRepository.save(user);
      }
    } else {
      // Find the user by email for regular login
      user = await userLoginRepository.findOne({ where: { emailAddress: email } });

      if (!user || !(await PersonalDetails.validatePassword(password, user.password))) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password.',
        });
        return;
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user, rememberMe);

    // Respond with the access token and user details
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken,
        user,
        // userStatus: user.active,
      },
    });

    // Create a login notification
    // const notificationRepos = AppDataSource.getRepository(Notifications);
    // const notification = notificationRepos.create({
    //   userId: user.id,
    //   message: 'Welcome to Businessroom! You have successfully logged in.',
    //   navigation: '/',
    // });

    // await notificationRepos.save(notification);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};
