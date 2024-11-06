import { EventBooking } from '@/api/entity/eventManagement/EventBooking';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateRequestBody } from '@/common/utils/requestBodyValidation';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
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

  const { status, userId } = req.body;
  if (!status) res.status(400).json({ status: 'success', message: 'Bad request! status is not defined' });

  try {
    const data = await bookedReposistory.find({ where: { userId, status } });
    res.status(200).json({ status: 'success', message: 'Event created successfully', data: data });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedEventDetails = async (req: Request, res: Response) => {
  const bookedReposistory = AppDataSource.getRepository(EventBooking);
  const validationRules = {
    id: { required: true, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  const { id } = req.body;
  try {
    const eventDetails = await bookedReposistory.find({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Event created successfully', data: eventDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
