import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { PersonalDetails } from '../../entity/personal/PersonalDetails';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const DeleteUserPhoto = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { targetUserId, isProfile } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'Invalid userId' });

    const personalRepo = AppDataSource.getRepository(PersonalDetails);
    const isAdmin = await personalRepo.findOne({
      where: { isAdmin: true },
    });

    if (!isAdmin)
      return res.status(403).json({ success: false, message: 'You are not authorized to perform this action' });

    const user = await personalRepo.findOne({
      where: { id: targetUserId },
    });

    if (!user) return res.status(404).json({ success: false, message: 'Invalid userId' });

    if (isProfile) {
      user.profilePictureUploadId = '';
    } else {
      user.bgPictureUploadId = '';
    }

    await personalRepo.save(user);

    return res.status(200).json({ success: true, message: 'User photo deleted by admin' });
  } catch (err: any) {
    // console.error('ERROR => ', err);
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message,
    });
  }
};
