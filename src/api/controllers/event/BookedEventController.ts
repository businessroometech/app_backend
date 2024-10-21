import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

export const BookedEvent = async (req: Request, res: Response) => {
  try {
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