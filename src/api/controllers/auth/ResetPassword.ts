// import bcrypt from "bcryptjs";
// import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Request, Response } from 'express';

import { PasswordResetToken } from '../../entity/others/PasswordResetToken';
import { UserLogin } from '../../entity/user/UserLogin';
// const snsClient = new SNSClient({
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
//   },
//   region: process.env.AWS_REGION || 'us-east-1',
// });

const generateResetToken = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// const sendResetSms = async (mobileNumber: string, token: string): Promise<void> => {
//   const params = {
//     Message: `Your password reset token is: ${token}`,
//     PhoneNumber: mobileNumber,
//   };

//   try {
//     const command = new PublishCommand(params);
//     await snsClient.send(command);
//     console.log(`Password reset SMS sent to ${mobileNumber}`);
//   } catch (error: any) {
//     throw new Error(`Failed to send password reset SMS: ${error.message}`);
//   }
// };

export const sendNumberVerificationToken = async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ status: 'error', message: 'Please provide a mobile number' });
    }

    const user: UserLogin | null = await UserLogin.findOne({ where: { mobileNumber } });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'User not found' });
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    console.log(`forgot password OTP :`, token);

    const existingToken = await PasswordResetToken.findOne({ where: { mobileNumber } });

    if (existingToken) {
      existingToken.token = token;
      existingToken.expiresAt = expiresAt;
      await existingToken.save();
    } else {
      await PasswordResetToken.create({
        mobileNumber,
        token,
        expiresAt,
      }).save();
    }

    // await PasswordResetToken.create({
    //   mobileNumber,
    //   token,
    //   expiresAt,
    // }).save();

    // await sendResetSms(mobileNumber, token);

    res.status(200).json({ status: 'success', message: 'Password reset SMS sent' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

export const verifyCodeForPasswordReset = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, token } = req.body;

    if (!mobileNumber || !token) {
      return res.status(400).json({ status: 'error', message: 'Please provide both mobile number and token' });
    }

    const isVerify: PasswordResetToken | null = await PasswordResetToken.findOne({ where: { mobileNumber, token } });

    if (!isVerify) {
      return res.status(400).json({ status: 'error', message: 'Invalid token' });
    }

    const expirydate = new Date(isVerify.expiresAt);

    if (new Date() > expirydate) {
      return res.status(400).json({ status: 'error', message: 'token has expired.' });
    }

    isVerify.isValid = true;
    await isVerify.save();

    res.status(200).json({ status: 'success', message: 'mobile number verified successflly' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, newPassword, token } = req.body;

    if (!newPassword) {
      return res.status(400).json({ status: 'error', message: 'Please provide a new password.' });
    }

    // const resetToken: PasswordResetToken | null = await PasswordResetToken.findOne({ where: { mobileNumber, token } });

    // if (!resetToken || !resetToken.isValid) {
    //   return res.status(400).json({ status: 'error', message: 'Invalid or expired reset token.' });
    // }

    const user: UserLogin | null = await UserLogin.findOne({ where: { mobileNumber } });

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newPassword;
    await user.save();

    // await resetToken.remove();

    res.status(200).json({ status: 'success', message: 'Password reset successfully', data: { user } });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};
