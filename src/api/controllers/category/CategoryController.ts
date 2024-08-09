import { Request, Response } from 'express';

import { Category } from '@/api/entity/sector/Category';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.body;
    const categories = await Category.find({ where: { sectorId } });

    res.status(200).json({
      status: 'success',
      message: 'Fetched categories successfully',
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
};
