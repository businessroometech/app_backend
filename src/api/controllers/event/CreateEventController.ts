import { Event } from '@/api/entity/eventManagement/Event';
import { EventParticipant } from '@/api/entity/eventManagement/EventParticipant';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

// Route handlers

export const CreatedEvent = async (req: Request, res: Response) => {
  const userRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);

  const { userId, status } = req.body;

  try {
    const data = await eventRepository.find({
      where: {
        status: status,
        // userId: userId,
      },
    });
    res.status(200).json({ status: 'success', message: 'Event created successfully', data: data });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating event' });
  }
};

export const getCreatedEventDetails = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const sectorRepository = AppDataSource.getRepository(Sector);
  const eventRepository = AppDataSource.getRepository(Event);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'id', repository: eventRepository, errorMessage: 'Please provide userId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id } = req.body;

  try {
    const eventDetails = await eventRepository.find({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Event fetched successfully', data: eventDetails });
  } catch (error) {
    console.error('Error getting event details:', error);
    return res.status(500).json({ status: 'error', message: 'Error getting event details' });
  }
};

export const cancelCreatedEvent = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const sectorRepository = AppDataSource.getRepository(Sector);
  const eventRepository = AppDataSource.getRepository(Event);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'id', repository: eventRepository, errorMessage: 'Please provide userId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id, status } = req.body;
  try {
    let event = await eventRepository.findOne({ where: { id } });

    if (!event) {
      return res.status(404).json({ status: 'error', message: 'Event not found' });
    }

    event.status = 'cancelled';
    await eventRepository.save(event);

    return res.status(200).json({ status: 'success', message: 'Event canceled successfully', data: event });
  } catch (error) {
    console.error('Error canceling event:', error);
    return res.status(500).json({ status: 'error', message: 'Error canceling event' });
  }
};

export const rescheduleCreatedEvent = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);

  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'id', repository: eventRepository, errorMessage: 'Please provide eventId' },
  ];

  // Validate and fetch related entities based on user input
  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id, startDatetime, endDatetime } = req.body;

  try {
    // Find the event by eventId
    let event = await eventRepository.findOne({ where: { id } });

    // Check if the event exists
    if (!event) {
      return res.status(404).json({ status: 'error', message: 'Event not found' });
    }

    // Update the event's start and end datetimes, and set status to 'rescheduled'
    event.startDatetime = startDatetime;
    event.endDatetime = endDatetime;
    event.status = 'rescheduled';

    // Save the updated event back to the database
    await eventRepository.save(event);

    return res.status(200).json({ status: 'success', message: 'Event rescheduled successfully', data: event });
  } catch (error) {
    console.error('Error rescheduling event:', error);
    return res.status(500).json({ status: 'error', message: 'Error rescheduling event' });
  }
};

// INVITATION
export const getEventParticipants = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const participantsRepository = AppDataSource.getRepository(EventParticipant);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide userId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { eventId } = req.body;
  try {
    const event = await eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ status: 'error', message: 'Event not found' });
    }

    return res.status(200).json({ status: 'success', data: event?.eventParticipants });
  } catch (error) {
    console.error('Error getting event participants:', error);
    return res.status(500).json({ status: 'error', message: 'Error getting event participants' });
  }
};

export const postSendEventInviation = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide userId' },
  ];

  const { eventId } = req.body;
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
  } catch (error) {
    console.error('Error booking service provider:', error);
    return res.status(500).json({ status: 'error', message: 'Error booking service provider' });
  }
};
