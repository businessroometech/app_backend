import { AppDataSource } from '@/server';
import { Request, Response } from 'express';


// CREATING
export const postCreatedEventDraft = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getAllCreatedDraft = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getDraftDetails = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

// BOOKED