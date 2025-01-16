import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { ResetPassword } from '@/api/entity/personal/ResetPassword';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { emailAddress } = req.body;

  try {
    if (!emailAddress) {
      res.status(400).json({
        status: 'error',
        message: 'Email address is required.',
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const resetPasswordRepository = AppDataSource.getRepository(ResetPassword);

    const user = await userRepository.findOne({ where: { emailAddress } });
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'No user found with this email address.',
      });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); 

    const resetPassword = resetPasswordRepository.create({
      token,
      expiresAt,
      user: user,
    });
    await resetPasswordRepository.save(resetPassword);

    const transporter = nodemailer.createTransport({
      host: 'mail.businessroom.ai',
      port: 465,
      secure: false,
      auth: {
        user: 'no-reply@businessroom.ai',
        pass: 'Business123!@#',
      },
    });

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'https://businessroom.vercel.app'}/reset-password?token=${token}`;

    // Send the email
    await transporter.sendMail({
      from: 'no-reply@businessroom.ai',
      to: emailAddress,
      subject: 'Password Reset Request',
      html: `
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link will expire in 1 hour.</p>
        `,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent successfully.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};
