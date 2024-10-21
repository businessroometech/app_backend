import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

export const getCreatedAllTicket = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getCreatedTicketDetails = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedAllTicket = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedTicketDetails = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
