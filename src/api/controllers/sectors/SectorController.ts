import { Request, Response } from 'express';

import { Sector } from '@/api/entity/sector/Sector';

export const getAllSectors = async (req: Request, res: Response) => {
  try {
    const sectors = await Sector.find();
    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched the sector',
      data: {
        sector: sectors,
      },
    });
  } catch (error) {
    console.error('Error fetching sector:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch sector' });
  }
};

export const getSector = async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.body;

    if (!sectorId) {
      res.status(400).json({ status: 'error', message: 'Provide sectorId!' });
      return;
    }

    const yourSector = await Sector.findOne({ where: { id: sectorId } });

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
