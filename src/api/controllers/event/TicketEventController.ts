import { Event } from '@/api/entity/eventManagement/Event';
import { Ticket } from '@/api/entity/eventManagement/Ticket';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

export const getCreatedAllTicket = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide sectorId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  try {
    const ticketDetails = await ticketRepository.find();
    return res
      .status(200)
      .json({ status: 'success', message: 'Created Ticket Event successfully', data: ticketDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getCreatedTicketDetails = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide sectorId' },
    { field: 'id', repository: ticketRepository, errorMessage: 'Please provide ticketId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id } = req.body;
  try {
    const ticketDetails = await ticketRepository.find({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Ticket fetched successfully', data: ticketDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedAllTicket = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide sectorId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  try {
    const ticketDetails = await ticketRepository.find();
    return res
      .status(200)
      .json({ status: 'success', message: 'Created Ticket fetched successfully', data: ticketDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getBookedTicketDetails = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide sectorId' },
    { field: 'id', repository: ticketRepository, errorMessage: 'Please provide ticketId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id } = req.body;
  try {
    const ticketDetails = await ticketRepository.find({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Ticket successfully', data: ticketDetails });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
