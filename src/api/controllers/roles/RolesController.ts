import { Request, Response } from 'express';

import { Role } from '@/api/entity/others/Role';

export const getRoles = async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.body;
    const roles = await Role.find({ where: { sectorId } });

    res.status(200).json({
      status: 'success',
      message: 'Fetched roles successfully',
      data: {
        roles,
      },
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch roles' });
  }
};
