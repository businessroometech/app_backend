import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { CookieOptions } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

import { RefreshToken } from '@/api/entity/others/RefreshToken';
import { UserLogin } from '../../entity/user/UserLogin';
import { Token } from '@/api/entity/others/Token';
import { OtpVerification } from '@/api/entity/others/OtpVerification';
import { AppDataSource } from '@/server';

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
    const { mobileNumber, password, rememberMe, isThisMobile = false } = req.body;

    if (!mobileNumber && !password) {
      res.status(400).json({ status: 'fail', message: 'Need to provide mobileNumber and password' });
      return;
    }

    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const refreshRepository = AppDataSource.getRepository(RefreshToken);

    const user: UserLogin | null = await userLoginRepository.findOne({ where: { mobileNumber } });

    if (!user || !(await UserLogin.validatePassword(password, user.password))) {
      res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(user, rememberMe);

    if (isThisMobile) {
      const refreshToken = generateRefreshToken(user, rememberMe);

      let cookieOptions: CookieOptions = {
        httpOnly: true,
      };

      if (process.env.NODE_ENV === 'production') {
        cookieOptions = { ...cookieOptions, secure: true };
      }

      res.cookie('refreshToken', refreshToken, cookieOptions);

      // store referesh token to the DB
      const rt = await refreshRepository.findOne({ where: { userId: user.id } });

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
        await refreshRepository.create({
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + expiresIn),
        }).save();
      }
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

const createHmac = (data: string): string => {
  return crypto.createHmac('sha256', process.env.HMAC_SECRET_KEY!).update(data).digest('hex');
};

export const generateUuidToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let accessToken;
    if (authHeader) {
      accessToken = authHeader.split(' ')[1];
    } else {
      res.status(401).json({ message: 'Authorization header missing' });
      return;
    }

    if (!accessToken) {
      res.status(401).json({ status: 'error', message: 'Access token is missing' });
      return;
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY!) as { id: string };

    const uuidToken = uuidv4(); // Generating a UUID
    const hmac = createHmac(uuidToken);

    const tokenRepository = AppDataSource.getRepository(Token);

    const token = await tokenRepository.create({
      userId: decoded.id,
      hmac,
      expiresAt: new Date(Date.now() + parseInt(process.env.UUID_TOKEN_EXPIRES_IN!)),
    }).save();

    res.cookie('uuidToken', uuidToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: parseInt(process.env.UUID_TOKEN_EXPIRES_IN!),
      sameSite: 'none'
    });

    res.status(200).json({ status: 'success', message: 'UUID token created', data: { token } });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      res.status(403).json({ status: 'error', message: 'Token expired. Please log in again.' });
    }
    else {
      res.status(500).json({ status: 'error', message: 'Server error.' });
    }
  }
};

export const verifyUuidToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const uuidToken = req.cookies.uuidToken;

    if (!uuidToken) {
      res.status(401).json({ status: 'error', message: 'UUID token is missing' });
      return;
    }

    const tokenRepository = AppDataSource.getRepository(Token);

    // Finding the token in the database using the HMAC
    const hmac = createHmac(uuidToken);
    const token = await tokenRepository.findOne({ where: { hmac } });

    if (!token) {
      res.status(401).json({ status: 'error', message: 'Invalid UUID token' });
      return;
    }

    if (new Date() > token.expiresAt) {
      await tokenRepository.remove(token);
      res.status(403).json({ status: 'error', message: 'UUID token expired' });
      return;
    }
    const { rememberMe = false } = req.body;
    // const token = { userId };

    const newAccessToken = generateAccessToken({ id: token.userId });
    const newRefreshToken = generateRefreshToken({ id: token.userId });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    const refreshRepository = AppDataSource.getRepository(RefreshToken);

    // store referesh token to the DB
    const rt = await refreshRepository.findOne({ where: { userId: token.userId } });

    const rememberMeExpiresIn = parseInt(process.env.REFRESH_TOKEN_IN_DB_EXPIRES_IN_REMENBER || '600000', 10);
    const defaultExpiresIn = parseInt(process.env.REFRESH_TOKEN_IN_DB_EXPIRES_IN || '3600000', 10);
    const expiresIn = rememberMe ? rememberMeExpiresIn : defaultExpiresIn;

    if (isNaN(expiresIn)) {
      throw new Error('Invalid expiration time');
    }

    if (rt) {
      rt.token = newRefreshToken;
      rt.expiresAt = new Date(Date.now() + expiresIn);
      await rt.save();
    } else {
      await refreshRepository.create({
        userId: token.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + expiresIn),
      }).save();
    }

    // Destroying the UUID token after use
    // await Token.delete(token.id);

    res.status(200).json({
      status: 'success',
      message: 'UUID token verified',
      data: {
        accessToken: newAccessToken,
        userId: token.userId
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    // const { mobileNumber } = req.body;
    const refreshToken = req.cookies.refreshToken;
    console.log('ASKED FOR TOKEN TO REFRESH......');
    if (!refreshToken) {
      res.status(401).json({ status: 'error', message: 'Refresh token is not present in cookies' });
      return;
    }

    const refreshRepository = AppDataSource.getRepository(RefreshToken);

    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY!) as { id: string; exp: number };

    const refresh = await refreshRepository.findOne({ where: { userId: payload.id } });

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
      res.status(401).json({ status: 'error', message: 'Refresh token expired. Please log in again.' });
      return;
    }

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

    // res.cookie('accessToken', newAccessToken, cookieOptions);
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    console.log('TOKEN GOT REFRESHED......');
    res.status(200).json({
      status: 'success',
      message: 'New access token and refresh token generated',
      data: {
        accessToken: newAccessToken,
        userId: payload.id
      },
    });
  } catch (error: any) {
    console.log('UNABLE TO REFRESH THE TOKEN......');
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ status: 'error', message: 'Refresh token expired. Please log in again.' });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
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


//--------------------------------------------- FOR MOBILE APP ---------------------------------------------------------------

export const verifyCode_mobile_app = async (req: Request, res: Response): Promise<void> => {
  try {
    const { verificationCode, mobileNumber } = req.body;

    if (!verificationCode || !mobileNumber) {
      res
        .status(400)
        .json({ status: 'error', message: 'Please provide mobileNumber and verification code' });
      return;
    }

    const otpVerificationRepository = AppDataSource.getRepository(OtpVerification);
    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const refreshRepository = AppDataSource.getRepository(RefreshToken);

    let isVerify = await otpVerificationRepository.findOne({ where: { mobileNumber, verificationCode, useCase: "Signup" } });

    if (!isVerify) {
      res.status(400).json({ status: 'error', message: 'Invalid verification code or mobileNumber' });
      return;

    }

    const expiryDate = new Date(isVerify.expiresAt);

    if (new Date() > expiryDate) {
      res.status(400).json({ status: 'error', message: 'Verification code is expired.' });
      return;

    }

    isVerify.isVerified = true;
    await isVerify.save();

    //checking is the profile completed or not
    const user: UserLogin | null = await userLoginRepository.findOne({ where: { mobileNumber } });

    if (!user) {
      res.status(400).json({ status: "error", message: "User with mobile number does not exist" });
      return;

    }

    const accessToken = generateAccessToken(user!);

    const refreshToken = generateRefreshToken(user!);

    let cookieOptions: CookieOptions = {
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions = { ...cookieOptions, secure: true };
    }

    res.cookie('refreshToken', refreshToken, cookieOptions);

    // store referesh token to the DB
    const rt = await refreshRepository.findOne({ where: { userId: user!.id } });

    // const rememberMeExpiresIn = parseInt(process.env.REFRESH_TOKEN_IN_DB_EXPIRES_IN_REMENBER || '600000', 10);
    const defaultExpiresIn = parseInt(process.env.REFRESH_TOKEN_IN_DB_EXPIRES_IN || '3600000', 10);
    const expiresIn = defaultExpiresIn;

    if (isNaN(expiresIn)) {
      throw new Error('Invalid expiration time');
    }

    if (rt) {
      rt.token = refreshToken;
      rt.expiresAt = new Date(Date.now() + expiresIn);
      await rt.save();
    } else {
      await refreshRepository.create({
        userId: user!.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + expiresIn),
      }).save();
    }

    res.status(200).json({
      status: 'success', message: 'Mobile number verified successfully', data: {
        user,
        accessToken
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};