import { Request, Response } from 'express';

import { RefreshToken } from '@/api/entity/RefreshToken';

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      res.status(400).json({ status: 'fail', message: 'Mobile number is required' });
      return;
    }

    await RefreshToken.delete({ mobileNumber });

    // Clear cookies
    res.clearCookie('accessToken');

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ status: 'error', message: 'Failed to log out' });
  }
};
