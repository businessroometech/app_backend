import { Event } from '@/api/entity/eventManagement/Event';
import { EventBooking } from '@/api/entity/eventManagement/EventBooking';
import { Ticket } from '@/api/entity/eventManagement/Ticket';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateRequestBody } from '@/common/utils/requestBodyValidation';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';
import { object } from 'zod';

export const getCreatedAllTicket = async (req: Request, res: Response) => {
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationRules = {
    // eventId: { required: true, type: 'string' },
    userId: { required: true, type: 'string' },
  };
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ status: 'success', message: 'User is not found' });

  try {
    const ticketDetails = await ticketRepository.find({ where: userId });
    return res
      .status(200)
      .json({ status: 'success', message: 'Created Ticket Event successfully', data: ticketDetails });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getCreatedTicketDetails = async (req: Request, res: Response) => {
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationRules = {
    eventId: { required: true, type: 'string' },
    userId: { required: true, type: 'string' },
  };
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id } = req.body;
  try {
    const ticketDetails = await ticketRepository.find({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Ticket fetched successfully', data: ticketDetails });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getBookedAllTicket = async (req: Request, res: Response) => {
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const bookedEventRepository = AppDataSource.getRepository(EventBooking);

  const validationRules = {
    // eventId: { required: true, type: 'string' },
    userId: { required: true, type: 'string' },
  };
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { userId, eventId } = req.body;
  if (!userId) return res.status(400).json({ status: 'success', message: 'User is not found' });

  try {
    const bookedEvents = await bookedEventRepository.find({ where: eventId });
    console.log('----booked events data id ----', bookedEvents);

    const ticketDetails = await ticketRepository.find({ where: userId });
    return res
      .status(200)
      .json({ status: 'success', message: 'Created Ticket fetched successfully', data: ticketDetails });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getBookedTicketDetails = async (req: Request, res: Response) => {
  const ticketRepository = AppDataSource.getRepository(Ticket);

  const validationRules = {
    eventId: { required: true, type: 'string' },
  };
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { eventId } = req.body;
  if (!eventId) return res.status(400).json({ status: 'bad request', message: 'please provdide event details' });

  try {
    const ticketDetails = await ticketRepository.find({ where: { eventId } });
    return res.status(200).json({ status: 'success', message: 'Ticket successfully', data: ticketDetails });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const bookingTicket = async (req: Request, res: Response) => {
  const bookingRepository = AppDataSource.getRepository(EventBooking);
  // const eventRepository = AppDataSource.getRepository(Event);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const validationRules = {
    // eventId: { required: true, type: 'string' },
    userId: { required: true, type: 'string' },
    eventId: { required: true, type: 'string' },
    ticketId: { required: true, type: 'string' },
  };

  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const { userId, eventId, ticketId, orderId, transactionId, price } = req.body;

  try {
    let ticket = await ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket || ticket?.quantityAvailable <= 0) {
      return res.status(400).json({ status: 'error', message: 'Ticket not found' });
    }

    if (!price) {
      let bookingUser = bookingRepository.create({
        userId,
        eventId,
        ticketId,
        amountPaid: price,
        bookingDate: new Date(),
      });

      const bookingConfirm = await bookingUser.save();

      ticket.quantityAvailable -= 1;
      const ticketData = await ticketRepository.save(ticket);

      return res
        .status(200)
        .json({ status: 'success', message: 'Created Ticket Event successfully', data: bookingConfirm, ticketData });
    }
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating in booking event' });
  }
};
