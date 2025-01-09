import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserLogin } from '../../entity/user/UserLogin';
import { AppDataSource } from '@/server';
import { createNotification } from '../notifications/notificationController';
import { Notifications } from '@/api/entity/notifications/Notifications';

const generateAccessToken = (user: { id: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id }, process.env.ACCESS_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_ACCESS_EXPIRES_IN_REMEMBER : process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

// const generateRefreshToken = (user: { id: string }, rememberMe: boolean = false): string => {
//   return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET_KEY!, {
//     expiresIn: rememberMe ? process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER : process.env.JWT_REFRESH_EXPIRES_IN,
//   });
// };

export const login = async (req: Request, res: Response,): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide an email and password.',
      });
      return;
    }

    const userLoginRepository = AppDataSource.getRepository(UserLogin);

    // Find the user by email
    const user: UserLogin | null = await userLoginRepository.findOne({ where: { email } });

    // Check if user exists and password is valid
    if (!user || !(await UserLogin.validatePassword(password, user.password))) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user, rememberMe);
    // const refreshToken = generateRefreshToken(user, rememberMe);

    // Set refresh token as an HTTP-only cookie
    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: rememberMe
    //     ? parseInt(process.env.JWT_REFRESH_COOKIE_MAX_AGE_REMEMBER!, 10)
    //     : parseInt(process.env.JWT_REFRESH_COOKIE_MAX_AGE!, 10),
    // });

    // Respond with the access token and user details
    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          country: user.country,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });

    const notificationRepos = AppDataSource.getRepository(Notifications);
    const notification = notificationRepos.create({
      userId: user.id,
      message: 'Welcome to our platform!, You have successfully logged in',
      navigation: '/dashboard',
    });

    // Save the notification
    await notificationRepos.save(notification);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};
