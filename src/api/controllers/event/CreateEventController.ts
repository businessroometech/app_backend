import { Event } from '@/api/entity/eventManagement/Event';
import { EventParticipant } from '@/api/entity/eventManagement/EventParticipant';
import { validateRequestBody } from '@/common/utils/requestBodyValidation';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

// Route handlers
export const CreatedEvent = async (req: Request, res: Response) => {
  const validationRules = {
    userId: { required: false, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const eventRepository = AppDataSource.getRepository(Event);

  const { userId, status } = req.body;

  if (!userId) res.status(400).json({ status: 'failed', message: 'Please provide userId or status' });

  try {
    const data = await eventRepository.find({
      where: {
        status: status,
        userId: userId,
      },
    });
    res.status(200).json({ status: 'success', message: 'Event created successfully', data: data });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating event' });
  }
};

export const getCreatedEventDetails = async (req: Request, res: Response) => {
  const eventRepository = AppDataSource.getRepository(Event);
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
    const eventDetails = await eventRepository.find({ where: { id } });
    if (!eventDetails || eventDetails.length === 0) {
      return res.status(204).json({ status: 'error', message: 'Event not found', data: [] });
    }
    return res.status(200).json({ status: 'success', message: 'Event fetched successfully', data: eventDetails });
  } catch (error) {
    console.error('Error getting event details:', error);
    return res.status(500).json({ status: 'error', message: 'Error getting event details' });
  }
};

export const cancelCreatedEvent = async (req: Request, res: Response) => {
  const eventRepository = AppDataSource.getRepository(Event);
  const validationRules = {
    id: { required: false, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { id, status } = req.body;
  try {
    let event = await eventRepository.findOne({ where: { id } });

    if (!event) {
      return res.status(204).json({ status: 'error', message: 'Event not found' });
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
  const eventRepository = AppDataSource.getRepository(Event);

  const validationRules = {
    id: { required: false, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { id, startDatetime, endDatetime } = req.body;

  if (!startDatetime || !endDatetime)
    return res.status(500).json({ status: 'error', message: 'Reschedulling unsuccessful' });

  try {
    // Find the event by eventId
    let event = await eventRepository.findOne({ where: { id } });

    // Check if the event exists
    if (!event || event.length === 0) {
      return res.status(204).json({ status: 'error', message: 'Event not found' });
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
  const eventRepository = AppDataSource.getRepository(Event);
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
    const event = await eventRepository.findOne({ where: { id: id } });

    if (!event) {
      return res.status(404).json({ status: 'error', message: 'Event not found' });
    }

    return res.status(200).json({ status: 'success', data: event?.eventParticipants });
  } catch (error) {
    console.error('Error getting event participants:', error);
    return res.status(500).json({ status: 'error', message: 'Error getting event participants' });
  }
};

// there is no link to send fo booking
export const postSendEventInviation = async (req: Request, res: Response) => {
  const eventRepository = AppDataSource.getRepository(Event);
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
