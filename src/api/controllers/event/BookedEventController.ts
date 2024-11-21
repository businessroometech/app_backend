import { EventBooking } from '@/api/entity/eventManagement/EventBooking';
import { validateRequestBody } from '@/common/utils/requestBodyValidation';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

export const BookedEvent = async (req: Request, res: Response) => {
  const bookedReposistory = AppDataSource.getRepository(EventBooking);
  const validationRules = {
    userId: { required: true, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { userId } = req.body;
  // if (!status) res.status(400).json({ status: 'error', message: 'Bad request! status is not defined' });

  try {
    const data = await bookedReposistory.find({ where: { userId } });

    if (!data || data.length === 0) {
      return res.status(204).json({ status: 'error', message: 'Booking not found', data: [] });
    }

    res.status(200).json({ status: 'success', message: 'Booking is fetched', data: data });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: error });
  }
};

export const getBookedEventDetails = async (req: Request, res: Response) => {
  const bookedReposistory = AppDataSource.getRepository(EventBooking);
  const validationRules = {
    id: { required: false, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  const { id } = req.body;
  try {
    const eventDetails = await bookedReposistory.find({ where: { id } });
    if (!eventDetails || eventDetails.length === 0) {
      return res.status(204).json({ status: 'error', message: 'Booking not found', data: [] });
    }

    return res.status(200).json({ status: 'success', message: 'Booking event details', data: eventDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: error });
  }
};
