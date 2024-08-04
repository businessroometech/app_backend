import { Request, Response } from 'express';

import { Sector } from '@/api/entity/Sector';

export const getSector = async (req: Request, res: Response) => {
  try {
    const { sectorName } = req.body;

    if (!sectorName) {
      res.status(400).json({ status: 'error', message: 'Provide sectorname!' });
      return;
    }

    const yourSector = await Sector.findOne({ where: { sectorName } });

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched the sector',
      data: {
        sector: yourSector,
      },
    });
  } catch (error) {
    console.error('Error fetching sector:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch sector' });
  }
};
