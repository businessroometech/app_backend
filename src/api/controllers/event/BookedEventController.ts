import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

export const BookedEvent = async (req: Request, res: Response) => {
  try {
    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const sectorRepository = AppDataSource.getRepository(Sector);
    const validationConfigs: ValidationConfig[] = [
      { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
      { field: 'sectorId', repository: sectorRepository, errorMessage: 'Please provide sectorId' },
    ];
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedEventDetails = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
