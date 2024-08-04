import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';

import { RefreshToken } from '@/api/entity/others/RefreshToken';

import { UserLogin } from '../../entity/user/UserLogin';

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

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, password, rememberMe } = req.body;

    if (!mobileNumber && !password) {
      res.status(400).json({ status: 'fail', message: 'Need to provide mobileNumber and password' });
      return;
    }

    const user: UserLogin | null = await UserLogin.findOne({ where: { mobileNumber } });

    if (!user || !(await UserLogin.validatePassword(password, user.password))) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(user, rememberMe);
    const refreshToken = generateRefreshToken(user, rememberMe);

    let cookieOptions: CookieOptions = {
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions = { ...cookieOptions, secure: true };
    }

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // store referesh token to the DB
    const rt = await RefreshToken.findOne({ where: { mobileNumber } });

    const rememberMeExpiresIn = parseInt(process.env.REFRESH_TOKEN_IN_DB_EXPIRES_IN_REMENBER || '600000', 10);
    const defaultExpiresIn = parseInt(process.env.REFRESH_TOKEN_IN_DB_EXPIRES_IN || '3600000', 10);
    const expiresIn = rememberMe ? rememberMeExpiresIn : defaultExpiresIn;

    if (isNaN(expiresIn)) {
      throw new Error('Invalid expiration time');
    }

    if (rt) {
      rt.token = refreshToken;
      rt.expiresAt = new Date(Date.now() + expiresIn);
      await rt.save();
    } else {
      await RefreshToken.create({
        mobileNumber,
        token: refreshToken,
        expiresAt: new Date(Date.now() + expiresIn),
      }).save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully',
      data: {
        accessToken,
        user,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber } = req.body;
    const refreshToken = req.cookies.refreshToken;

    if (!mobileNumber || !refreshToken) {
      res.status(401).json({ status: 'error', message: 'Mobile number and refresh token required' });
      return;
    }

    const refresh = await RefreshToken.findOne({ where: { mobileNumber } });

    if (!refresh) {
      res.status(401).json({ status: 'error', message: 'Refresh token not found' });
      return;
    }

    const isTokenValid = await bcrypt.compare(refreshToken, refresh.token);

    if (!isTokenValid || refresh.revokedTokens.includes(refreshToken)) {
      res.status(401).json({ status: 'error', message: 'Invalid or revoked refresh token. Please log in again.' });
      return;
    }

    if (new Date() > refresh.expiresAt) {
      res.status(403).json({ status: 'error', message: 'Refresh token expired. Please log in again.' });
      return;
    }

    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY!) as { id: string; exp: number };

    const newAccessToken = generateAccessToken({ id: payload.id });
    const newRefreshToken = generateRefreshToken({ id: payload.id });

    // Hash and store the new refresh token
    refresh.token = await bcrypt.hash(newRefreshToken, 10);
    refresh.revokedTokens.push(refreshToken);
    await refresh.save();

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: 'strict',
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('accessToken', newAccessToken, cookieOptions);
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      message: 'New access token and refresh token generated',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(403).json({ status: 'error', message: 'Refresh token expired. Please log in again.' });
    } else {
      res.status(403).json({ status: 'error', message: 'Invalid refresh token' });
    }
  }
};

//----------for protected routed you have to extend request interface-------

declare module 'express' {
  interface Request {
    user?: any;
  }
}

export const protectedRoute = (req: Request, res: Response): void => {
  res.status(200).json({ message: 'This is a protected route', user: req.user });
};
