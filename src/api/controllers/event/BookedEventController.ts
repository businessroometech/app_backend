import { EventBooking } from '@/api/entity/eventManagement/EventBooking';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

export const BookedEvent = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(EventBooking);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { status } = req.body;
  if (!status) res.status(400).json({ status: 'success', message: 'Bad request! status is not defined' });

  try {
    const data = await eventRepository.find({ where: { status } });
    res.status(200).json({ status: 'success', message: 'Event created successfully', data: data });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedEventDetails = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(EventBooking);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'id', repository: eventRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide userId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id } = req.body;
  try {
    const eventDetails = await eventRepository.find({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Event created successfully', data: eventDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
