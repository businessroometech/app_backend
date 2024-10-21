import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

// Route handlers

export const CreatedEvent = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const sectorRepository = AppDataSource.getRepository(Sector);
  // const eventRepository = AppDataSource.getRepository(Event);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    // { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide userId' },
    { field: 'sectorId', repository: sectorRepository, errorMessage: 'Please provide sectorId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  try {
    // const filteredEvent = await eventRepository.find({ where: { 'filtered' } });
    // res.status(200).json({ status: 'success', message: 'Event created successfully', data:filteredEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating event' });
  }
};

export const getCreatedEventDetails = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const sectorRepository = AppDataSource.getRepository(Sector);
  // const eventRepository = AppDataSource.getRepository(Event);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    // { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide userId' },
    { field: 'sectorId', repository: sectorRepository, errorMessage: 'Please provide sectorId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  try {
    // const eventDetails = await eventRepository.find({ where: { 'eventId' } });
    // res.status(200).json({ status: 'success', message: 'Event created successfully', data:filteredEvent });
  } catch (error) {
    console.error('Error getting event details:', error);
    return res.status(500).json({ status: 'error', message: 'Error getting event details' });
  }
};

export const cancelCreatedEvent = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ status: 'success', message: 'Event canceled successfully' });
  } catch (error) {
    console.error('Error canceling event:', error);
    return res.status(500).json({ status: 'error', message: 'Error canceling event' });
  }
};

export const rescheduleCreatedEvent = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const sectorRepository = AppDataSource.getRepository(Sector);
  // const eventRepository = AppDataSource.getRepository(Event);
  // const rescheduleRepository = AppDataSource.getRepository(Reschedule);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    // { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide userId' },
    // { field: 'scheduleId', repository: eventRepository, errorMessage: 'Please provide userId' },
    { field: 'sectorId', repository: sectorRepository, errorMessage: 'Please provide sectorId' },
  ];

  try {
    // const rescheduleEvent = await eventRepository.find({ where: { 'eventId' } });
    // res.status(200).json({ status: 'success', message: 'Event Rescheduled successfully', data:filteredEvent });
  } catch (error) {
    console.error('Error rescheduling event:', error);
    return res.status(500).json({ status: 'error', message: 'Error rescheduling event' });
  }
};

// INVITATION

export const getEventParticipants = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ status: 'success', data: 'Participants data' });
  } catch (error) {
    console.error('Error getting event participants:', error);
    return res.status(500).json({ status: 'error', message: 'Error getting event participants' });
  }
};

export const postSendEventInviation = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ status: 'success', message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return res.status(500).json({ status: 'error', message: 'Error sending invitation' });
  }
};

// SERVICE PROVIDERS

export const getEventServiceProviders = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ status: 'success', message: 'Service providers fetched successfully' });
  } catch (error) {
    console.error('Error fetching service providers:', error);
    return res.status(500).json({ status: 'error', message: 'Error fetching service providers' });
  }
};

export const postBookServiceProvider = async (req: Request, res: Response) => {
  
  try {
    res.status(200).json({ status: 'success', message: 'Service provider booked successfully' });
  } catch (error) {
    console.error('Error booking service provider:', error);
    return res.status(500).json({ status: 'error', message: 'Error booking service provider' });
  }
};
