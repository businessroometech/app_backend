import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { ResetPassword } from "@/api/entity/personal/ResetPassword";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;
  
    try {
      if (!token || !newPassword) {
        res.status(400).json({
          status: 'error',
          message: 'Token and new password are required.',
        });
        return;
      }
  
      const resetPasswordRepository = AppDataSource.getRepository(ResetPassword);
      const userRepository = AppDataSource.getRepository(PersonalDetails);
  
      const resetPasswordEntry = await resetPasswordRepository.findOne({
        where: { token },
        relations: ['user'],
      });
  
      if (!resetPasswordEntry) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid or expired token.',
        });
        return;
      }
  
      if (resetPasswordEntry.expiresAt < new Date()) {
        res.status(400).json({
          status: 'error',
          message: 'Token has expired.',
        });
        return;
      }
        
      const user = resetPasswordEntry.user;
      user.password = await PersonalDetails.hashPassword(newPassword); 
      await userRepository.save(user);
      await resetPasswordRepository.remove(resetPasswordEntry);
  
      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully.',
      });
    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong! Please try again later.',
      });
    }
  };
  