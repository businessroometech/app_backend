import bcrypt from "bcryptjs";
import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { OtpVerification } from "@/api/entity/others/OtpVerification";
import { AppDataSource } from "@/server";

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, newPassword, verificationCode } = req.body;

    if (!newPassword) {
      return res.status(400).json({ status: 'error', message: 'Please provide a new password.' });
    }
    console.log("MobileNumber and code @ reset password", mobileNumber, verificationCode);
    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const otpVerificationRepository = AppDataSource.getRepository(OtpVerification);

    const token: OtpVerification | null = await otpVerificationRepository.findOne({ where: { mobileNumber, verificationCode, useCase: 'Forgot Password' } });

    if (!token || !token.isVerified) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired Otp token.' });
    }

    const user: UserLogin | null = await userLoginRepository.findOne({ where: { mobileNumber: mobileNumber } });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    // await resetToken.remove();

    res.status(200).json({ status: 'success', message: 'Password reset successfully', data: { user } });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, password, newPassword } = req.body;

    const userLoginRepository = AppDataSource.getRepository(UserLogin);

    const user: UserLogin | null = await userLoginRepository.findOne({ where: { id: userId } })

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Verify the current password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
    }

    // new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Password changed successfully', data: { user } });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong' });
  }
}