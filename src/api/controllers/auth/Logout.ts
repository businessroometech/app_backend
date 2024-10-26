import { Request, Response } from 'express';

import { RefreshToken } from '@/api/entity/others/RefreshToken';
import { AppDataSource } from '@/server';

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

    if (!userId) {
      res.status(400).json({ status: 'error', message: 'UserId is required' });
      return;
    }

    await refreshTokenRepository.delete({ userId });

    // Clear cookies
    res.clearCookie('refreshToken');

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ status: 'error', message: 'Failed to log out' });
  }
};
