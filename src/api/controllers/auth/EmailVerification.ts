import { Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { AppDataSource } from '@/server';
import { Notifications } from '@/api/entity/notifications/Notifications';

interface TokenPayload extends JwtPayload {
  userId: number;
}

export const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);
    const user = await personalDetailsRepo.findOne({ where: { emailAddress: email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.active === 1) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }
    if (user.active === -1) {
      return res.status(403).json({ success: false, message: 'User is blocked from using this platform' });
    }

    // Generate a verification token
    const verificationToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_SECRET_KEY!,
      { expiresIn: '1h' }
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?token=${verificationToken}`;

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
      to: email,
      subject: "Businessroom.ai - Verify Your Email Address",
      html: `
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://businessroom.ai" style="display: inline-block; background-color: #2196F3; color: white; 
                font-size: 32px; font-weight: 600; width: 50px; height: 50px; line-height: 50px; 
                border-radius: 12px; text-decoration: none;">
                b
              </a>
            </div>
            
            <h1 style="color: #007bff; text-align: center;">Welcome to Businessroom.ai!</h1>
            
            <p>Hi there,</p>
            
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${verificationLink}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                 color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Businessroom.ai. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ success: false, message: 'Verification token is missing' });
      return;
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!) as TokenPayload;
      const userId: any = decoded.userId;

      const userRepository = AppDataSource.getRepository(PersonalDetails);
      const user = await userRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      if (user.active === 1) {
        res.status(400).json({ success: false, message: 'Email is already verified' });
        return;
      }

      user.active = 1;
      await userRepository.save(user);

      // Create a notification
      const notificationRepos = AppDataSource.getRepository(Notifications);
      const notification = notificationRepos.create({
        userId: user.id,
        message: 'Your email has been successfully verified. Welcome to Businessroom.ai!',
        navigation: '/',
      });
      await notificationRepos.save(notification);

      res.status(200).json({ success: true, message: 'Email successfully verified' });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(400).json({ success: false, message: 'Verification link has expired' });
      } else if (err instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ success: false, message: 'Invalid verification token' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during verification' });
  }
};