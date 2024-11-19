import { Request, response, Response } from 'express';
import { getRepository, getTreeRepository } from 'typeorm';
import catchAsyncErrors from '@/api/middlewares/catchAsyncErrors';
import errorHandler from '@/common/middleware/errorHandler';
import { ErrorHandler } from '@/api/middlewares/error';
import { Ticket } from '@/api/entity/eventManagement/Ticket';
import { AppDataSource } from '@/server';
import { Event } from '@/api/entity/eventManagement/Event';
import { EventBooking } from '@/api/entity/eventManagement/EventBooking';
import { DressCode } from '@/api/entity/eventManagement/DressCode';
import { EventRule } from '@/api/entity/eventManagement/EventRule';
import { EventMedia } from '@/api/entity/eventManagement/EventMedia';
import { EventSchedule } from '@/api/entity/eventManagement/EventSchedule';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { UserAddress } from '@/api/entity/user/UserAddress';
import { EventDraft } from '@/api/entity/eventManagement/EventDraft';
import { Dropdown } from '@/api/entity/eventManagement/Dropdown';
import { validateRequestBody } from '@/common/utils/requestBodyValidation';
import { EventOrganiser, SocialMediaLink } from '@/api/entity/eventManagement/EventOrganiser';
import { minLength } from 'class-validator';
import { SoldTicket } from '@/api/entity/eventManagement/SoldTicket';
import NotificationController from '../notifications/Notification';
// __________________________________Common Methods________________________________

// Dynamic function to map and create related entities
const createRelatedEntities = async ({
  repository,
  data,
  eventId,
  mappingFunction,
}: {
  repository: any;
  data: any[];
  eventId: string;
  mappingFunction: (item: any, eventId: string) => any;
}) => {
  return data.map((item) => repository.create(mappingFunction(item, eventId)));
};

/**
 * TODO use
 * Validates the userId by checking if the user exists in the PersonalDetails table.
 * If the user is found, it proceeds; otherwise, it sends an error response.
 *
 * @param userId - The ID of the user to validate.
 * @param res - The Express response object.
 * @returns - The user object if found, or false if not found or invalid.
 */
export const validateUserId = async (userId: string, res: Response) => {
  if (!userId) {
    res.status(400).json({
      status: 'error',
      message: 'User ID is required.',
    });
    return false;
  }

  const user = await AppDataSource.getRepository(PersonalDetails).find({ where: { id: userId } });

  if (!user) {
    res.status(403).json({
      status: 'error',
      message: 'User not found or not authorized to perform this action.',
    });
    return false;
  }
  return user;
};

// testing
export const createEvents = async (req: Request, res: Response) => {
  res.json({ name: 'event-start' });
};

// we can pass in where get the event or ticket , when user seen any event more than one i will increse count one
export const incrementCounter = async (eventId: string) => {
  const eventRepository = AppDataSource.getRepository(Event);
  const event = await eventRepository.findOne({ where: { id: eventId } });
  if (!event) {
    throw new ErrorHandler('Event not found', 404);
  }
  // Increment the count
  event.count = (event.count ?? 0) + 1;
  // Save the updated event
  await eventRepository.save(event);
  return event;
};

const createTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const { eventId, userId, ticketType, price, quantityAvailable, isFree, inclusions } = req.body;

 // Validate required fields
 if (!eventId || !ticketType || quantityAvailable === undefined) {
   return res.status(400).json({
     status: 'error',
     message: 'Missing required fields',
   });
 }

 const ticketRepository = AppDataSource.getRepository(Ticket);

 // Create a new ticket
 const ticket = ticketRepository.create({
   eventId,
   userId,
   ticketType,
   price: isFree ? 0 : price,
   quantityAvailable,
   isFree,
   inclusions,
 });

 // Save the ticket
 await ticketRepository.save(ticket);

 return res.status(201).json({
   status: 'success',
   message: 'Ticket created successfully',
   data: {
     ticket,
   },
 });
});


// __________________________________event Ticket________________________________

// Update Ticket
export const updateTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const validationRules = {
    ticketId: { type: 'string' },
    userId: { required: false, type: 'string',  },
    ticketType: { type: 'string' },
    price: { type: 'number' },
    quantityAvailable: { type: 'number' },
    isFree: { type: 'boolean' },
    inclusions: { type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

  const { ticketId, eventId, ticketType, price, quantityAvailable, isFree, inclusions } = req.body;
  // Validate required fields
  if (!ticketId || !eventId || !ticketType || !quantityAvailable) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields',
    });
  }

  const ticketRepository = AppDataSource.getRepository(Ticket);
  // Find the ticket by ID
  let ticket = await ticketRepository.findOne({ where: { id: ticketId, eventId } });
  if (!ticket) {
    return res.status(404).json({
      status: 'error',
      message: 'Ticket not found',
    });
  }
  // Update the ticket fields
  ticket.ticketType = ticketType;
  ticket.price = isFree ? 0 : price;
  ticket.quantityAvailable = quantityAvailable;
  ticket.isFree = isFree;
  ticket.inclusions = inclusions;
  await ticketRepository.save(ticket);
  return res.status(200).json({
    status: 'success',
    message: 'Ticket updated successfully',
    data: {
      ticket,
    },
  });
});



// Get Tickets by event ID
export const getTicketList = async (req: Request, res: Response) => {
  const validationRules = {
    eventId: { type: 'string', minLength: 10 },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

  try {
    const { eventId } = req.body;
    if (!eventId) {
      res.status(404).json({ status: 'error', message: 'event id is required' });
    }
    const ticketCodeRepo = AppDataSource.getRepository(Ticket);
    const tickets = await ticketCodeRepo.find({ where: { eventId } });
    // Check if tickets were found
    if (tickets.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No tickets found for this event',
      });
    }
    // Return the found tickets
    return res.status(200).json({
      status: 'success',
      message: 'Tickets retrieved successfully',
      data: {
        tickets,
      },
    });
  } catch (error) {
    console.error('Error retrieving tickets:', error);
    return res.status(500).json({ message: 'Error retrieving tickets', error });
  }
};

// Get Ticket details
export const getTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const validationRules = {
    id: { type: 'string', minLength: 10 },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

  const { id } = req.body;
  // Validate that ticket ID is provided
  if (!id) {
    throw new ErrorHandler('Ticket ID is required', 400);
  }
  // Get the ticket repository
  const ticketRepository = AppDataSource.getRepository(Ticket);
  // Find the ticket by ID
  const ticket = await ticketRepository.find({ where: { id } });
  // Check if the ticket was found
  if (!ticket) {
    throw new ErrorHandler('Ticket not found', 404);
  }
  // Return the ticket details
  return res.status(200).json({
    status: 'success',
    message: 'Ticket retrieved successfully',
    ticket,
  });
});

// Delete Ticket
export const deleteTicket = async (req: Request, res: Response) => {
  const validationRules = {
    ticketId: { type: 'string', minLength: 10 },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

  try {
    const { ticketId } = req.body;
    // Validate that ticketId is provided
    if (!ticketId) {
      return res.status(400).json({
        status: 'error',
        message: 'ticketId is required',
      });
    }
    const TicketItem = AppDataSource.getRepository(Ticket);
    const ticket = await TicketItem.findOne({ where: { id: ticketId } });
    // Check if the ticket exists
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found',
      });
    }
    // Delete the ticket
    await ticket.remove();

    return res.status(200).json({
      status: 'success',
      message: 'Ticket deleted',
      ticketId,
    });
  } catch (err) {
    console.log(`${err} error deleting ticket`);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};
