import { Request, response, Response } from 'express';
import { getRepository, getTreeRepository } from 'typeorm';
import catchAsyncErrors from '@/api/middlewares/catchAsyncErrors';
import errorHandler from '@/common/middleware/errorHandler';
import { ErrorHandler } from '@/api/middlewares/error';
import { Ticket } from '@/api/entity/eventManagement/Ticket';
import { AppDataSource } from '@/server';
import { Event } from '@/api/entity/eventManagement/Event';
import { EventBooking } from '@/api/entity/eventManagement/EventBooking';
import { DraftEvent } from '@/api/entity/eventManagement/DraftEvent';
import { DressCode } from '@/api/entity/eventManagement/DressCode';
import { EventRule } from '@/api/entity/eventManagement/EventRule';
import { EventMedia } from '@/api/entity/eventManagement/EventMedia';

export const createEvents = async (req: Request, res: Response) => {
  res.json({ name: 'event-start' });
};

// __________________________________event Ticket________________________________

// Function to create or update a ticket based on ticketId

// Add or Update Ticket
export const addOrUpdateTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const {
    ticketId, // Optional for update
    eventId,
    ticketType,
    price,
    quantityAvailable,
    isFree,
    inclusions,
  } = req.body;

  // Validate required fields
  if (!eventId || !ticketType || !price || !quantityAvailable || isFree === undefined) {
    throw new ErrorHandler('Missing required fields', 400);
  }

  const ticketRepository = AppDataSource.getRepository(Ticket);
  const eventRepository = AppDataSource.getRepository(Event);

  // Check if the event exists
  const event = await eventRepository.findOne({ where: { id: eventId } });
  if (!event) {
    throw new ErrorHandler('Event not found', 404);
  }

  let ticket;
  if (ticketId) {
    // Update existing ticket
    ticket = await ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) {
      throw new ErrorHandler('Ticket not found', 404);
    }

    // Update the ticket fields
    ticket.ticketType = ticketType;
    ticket.price = price;
    ticket.quantityAvailable = quantityAvailable;
    ticket.isFree = isFree;
    ticket.inclusions = inclusions;
  } else {
    // Create a new ticket
    ticket = ticketRepository.create({
      eventId,
      ticketType,
      price,
      quantityAvailable,
      isFree,
      inclusions,
    });
  }

  // Save the ticket
  await ticketRepository.save(ticket);

  const message = ticketId ? 'Ticket updated successfully' : 'Ticket created successfully';

  return res.status(200).json({
    status: 'success',
    message,
    data: {
      ticket,
    },
  });
});

// // Get Tickets by Customer ID
// export const getTicketList = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.body;

//     // Validate userId
//     if (!userId) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Customer ID is required',
//       });
//     }

//     // Query the database for tickets associated with the userId
//     const tickets = await TicketItem.find({ where: { userId } });

//     // Check if tickets were found
//     if (tickets.length === 0) {
//       return res.status(404).json({
//         status: 'error',
//         message: 'No tickets found for this customer ID',
//       });
//     }

//     // Return the found tickets
//     return res.status(200).json({
//       status: 'success',
//       message: 'Tickets retrieved successfully',
//       data: {
//         tickets,
//       },
//     });
//   } catch (error) {
//     console.error('Error retrieving tickets:', error);
//     return res.status(500).json({ message: 'Error retrieving tickets', error });
//   }
// };

// Get Ticket details
// export const getTicket = catchAsyncErrors(async (req: Request, res: Response) => {
//   const { id } = req.body;

//   // Validate that ticket ID is provided
//   if (!id) {
//     throw new ErrorHandler('Ticket ID is required', 400);
//   }

//   // Get the ticket repository
//   const ticketRepository =AppDataSource.getRepository(Ticket);

//   // Find the ticket by ID
//   const ticket = await ticketRepository.find({ where: { id } });

//   // Check if the ticket was found
//   if (!ticket) {
//     throw new ErrorHandler('Ticket not found', 404);
//   }

//   // Return the ticket details
//   return res.status(200).json({
//     status: 'success',
//     message: 'Ticket retrieved successfully',
//     ticket,
//   });
// });

// // Delete Ticket
// export const deleteTicket = async (req: Request, res: Response) => {
//   try {
//     const { ticketId } = req.body;

//     // Validate that ticketId is provided
//     if (!ticketId) {
//       return res.status(400).json({
//         status: "error",
//         message: "ticketId is required"
//       });
//     }

//     // Find the ticket by ticketId
//     const ticket = await TicketItem.findById({ where: { id: ticketId } });

//     // Check if the ticket exists
//     if (!ticket) {
//       return res.status(404).json({
//         status: "error",
//         message: "Ticket not found"
//       });
//     }

//     // Delete the ticket
//     await TicketItem.deleteById(ticketId);

//     return res.status(200).json({
//       status: "success",
//       message: "Ticket deleted",
//       ticketId
//     });

//   } catch (err) {
//     console.log(`${err} error deleting ticket`);
//     return res.status(500).json({
//       status: "error",
//       message: "Internal server error",
//       error: err.message
//     });
//   }
// };

// ______________________event controller__________________________________________

// Create or Update event
// If eventId is provided, find the event and update it. If only userId is provided, create a new event.
// There are two entities: DraftEvent and Event. If isDraft is true, save the event in DraftEvent, otherwise save in Event.


export const createOrUpdateEvent = async (req: Request, res: Response) => {
  try {
    const {
      eventId,
      name,
      description,
      eventType,
      category,
      startDatetime,
      endDatetime,
      capacity,
      isInviteOnly,
      status,
      venueName,
      addressId,
      bannerImageUrl,
      livestreamLink,
      accessCode,
      registrationDeadline,
      organizerId,
      schedules,
      dressCodes,
      eventMedia,
      eventRules,
      isDraft,
    } = req.body;

    // Choose the correct repository based on the draft status
    const eventRepository = isDraft ? AppDataSource.getRepository(DraftEvent) : AppDataSource.getRepository(Event);
    let event:any;

    // If eventId is provided, find the event by its ID
    if (eventId) {
      event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        return res.status(404).json({
          status: 'error',
          message: 'Event not found',
        });
      }

      // Update the existing event with new details
      Object.assign(event, {
        name,
        description,
        eventType,
        category,
        startDatetime,
        endDatetime,
        capacity,
        isInviteOnly,
        status,
        venueName,
        addressId,
        bannerImageUrl,
        livestreamLink,
        accessCode,
        registrationDeadline,
        organizerId,
        schedules,
      });

      // Update or create related entities like dressCodes, eventMedia, and eventRules
      if (dressCodes) {
        const dressCodeRepo = AppDataSource.getRepository(DressCode);
        event.dressCodes = await dressCodeRepo.save(dressCodes.map((code: any) => ({
          gender: code.gender,
          dressCode: code.dressCode,
          event: event,
        })));
      }

      if (eventMedia) {
        const eventMediaRepo = AppDataSource.getRepository(EventMedia);
        event.eventMedia = await eventMediaRepo.save(eventMedia.map((media: any) => ({
          mediaType: media.mediaType,
          mediaUrl: media.mediaUrl,
          event: event,
        })));
      }

      if (eventRules) {
        const eventRuleRepo = AppDataSource.getRepository(EventRule);
        event.eventRules = await eventRuleRepo.save(eventRules.map((rule: any) => ({
          ruleType: rule.ruleType,
          description: rule.description,
          event: event,
        })));
      }
      
    } else {
      // If eventId is not provided, create a new event
      event = eventRepository.create({
        name,
        description,
        eventType,
        category,
        startDatetime,
        endDatetime,
        capacity,
        isInviteOnly,
        status,
        venueName,
        addressId,
        bannerImageUrl,
        livestreamLink,
        accessCode,
        registrationDeadline,
        organizerId,
        schedules,
      });

      // Create related entities like dressCodes, eventMedia, and eventRules
      if (dressCodes) {
        const dressCodeRepo = AppDataSource.getRepository(DressCode);
        event.dressCodes = dressCodes.map((code: any) => dressCodeRepo.create({
          gender: code.gender,
          dressCode: code.dressCode,
          // event: event,
        }));
      }

      if (eventMedia) {
        const eventMediaRepo = AppDataSource.getRepository(EventMedia);
        event.eventMedia = eventMedia.map((media: any) => eventMediaRepo.create({
          mediaType: media.mediaType,
          mediaUrl: media.mediaUrl,
          // event: event,
        }));
      }

      if (eventRules) {
        const eventRuleRepo = AppDataSource.getRepository(EventRule);
        event.eventRules = eventRules.map((rule: any) => eventRuleRepo.create({
          ruleType: rule.ruleType,
          description: rule.description,
          // event: event,
        }));
      }
    }

    // Save the event to the appropriate table (DraftEvent or Event)
    await eventRepository.save(event);

    // Determine the success message
    const message = eventId ? 'Event updated successfully' : 'Event created successfully';

    if (isDraft) {
      return res.status(200).json({
        status: 'success',
        message: 'Event saved in draft',
        data: { event },
      });
    }

    return res.status(200).json({
      status: 'success',
      message,
      data: { event },
    });

  } catch (error) {
    console.error('Error while creating or updating the event:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while processing the event.',
    });
  }
};


// // get-near-events
// export const getNearEvent = catchAsyncErrors(async (req: Request, res: Response) => {
//   const { category, location } = req.body;

//   // Get the event repository
//   const eventRepository = getRepository(Event);

//   // Check for events that match the provided location and category
//   let events = await eventRepository.find({
//     where: {
//       location,
//       category: "physical"  // Only matching 'physical' category events
//     }
//   });

//   if (events.length === 0) {
//     // If no event is found, throw an error
//     throw new ErrorHandler('No events found in this location', 404);
//   }

//   // Return the response with the found events
//   const message = 'Events retrieved successfully';

//   return res.status(200).json({
//     status: 'success',
//     message,
//     data: events,
//   });
// });

// // TODO get popular event

// // event-details by details="about", "schedule"
// export const eventByDetails = catchAsyncErrors(async (req: Request, res: Response) => {
//   const { details, userId, eventId } = req.body;

//   // Get the event repository
//   const eventRepository = getRepository(Event);

//   // Validate userId and eventId
//   if (!userId || !eventId) {
//     throw new ErrorHandler("Customer ID or Event ID is incorrect", 404);
//   }

//   // Fetch the event based on userId and eventId
//   const event = await eventRepository.findOne({
//     where: { userId, eventId }
//   });

//   if (!event) {
//     throw new ErrorHandler("Event not found", 404);
//   }

//   // Prepare the response based on the 'details' field
//   let response: any = {};

//   if (details === "about") {
//     response = {
//       aboutEvent: event.aboutEvent,
//       organiserId: event.organiserId,
//       organiserName: event.organiserName,
//       organiserEmail: event.organiserEmail,
//       organiserPhone: event.organiserPhone,
//       organiserLocation: event.organiserLocation,
//       organiserSocialMediaName: event.organiserSocialMediaName,
//       organiserSocialMediaLink: event.organiserSocialMediaLink
//     };
//   } else if (details === "schedule") {
//     response = {
//       scheduleEventId: event.scheduleEventId,
//       scheduleEventTitle: event.scheduleEventTitle,
//       scheduleEventTimeStart: event.scheduleEventTimeStart,
//       scheduleEventTimeEnd: event.scheduleEventTimeEnd
//     };
//   } else if (details === "dressCode") {
//     response = {
//       dressCodeId: event.dressCodeId,
//       dressCodeType: event.dressCodeType,
//       dressCodeGender: event.dressCodeGender,
//       dressCode: event.dressCode
//     };
//   } else if (details === "restrictions") {
//     response = {
//       Inclusions: event.Inclusions,
//       ageRestrictions: event.ageRestrictions,
//       eventEntryType: event.eventEntryType
//     };
//   } else {
//     throw new ErrorHandler("Invalid details type", 400);
//   }

//   // Add common event details
//   const commonDetails = {
//     eventType: event.eventType,
//     eventName: event.eventName,
//     eventDate: event.eventDate,
//     eventStartTime: event.eventStartTime,
//     eventEndTime: event.eventEndTime,
//     rsvpDate: event.rsvpDate,
//     rsvpTime: event.rsvpTime,
//     eventParticipants: event.eventParticipants
//   };

//   // Merge the specific and common responses
//   const data = { ...commonDetails, ...response };

//   // Return the response
//   const message = 'Event details retrieved successfully';

//   return res.status(200).json({
//     status: 'success',
//     message,
//     data
//   });
// });

// // get-event-details-options in form
export const eventDetailsOptions = catchAsyncErrors(async (req: Request, res: Response) => {
  const { userId } = req.body;

  // console.warn("Request body:", req.body);
  
  // Get the event booking repository
  const eventRepository = AppDataSource.getRepository(EventBooking);
  // console.log("Event Repository:", eventRepository);

  // Validate the provided userId
  if (!userId) {
    throw new ErrorHandler("User ID is not available", 404);
  }

  // Fetch event booking details based on userId
  const eventBooking = await eventRepository.find(userId);
 console.log("eventBooking", eventBooking);
 
  // Check if the event booking exists for the given userId
  if (!eventBooking) {
    throw new ErrorHandler('User not found or unauthorized, please retry after login', 404);
  }

  // Define the options for event details
  const data = {
    eventType: [
      'conference',
      'seminar',
      'workshop',
      'webinar',
      'meetup',
      'networking',
      'trade show',
      'expo',
      'festival',
      'concert',
      'hackathon',
      'competition',
      'fundraiser',
      'gala',
      'banquet',
      'award ceremony',
      'product launch',
      'team building',
      'training',
      'retreat',
    ],

    eventDate: [
       // Current date
      new Date(),
       // 30 days from now as future date
      new Date(new Date().setDate(new Date().getDate() + 30)),
    ],

    eventStartTime: [
      // Show "Full Day" if current time is midnight
      new Date().getHours() === 0 ? 'Full Day' : new Date().toLocaleTimeString(), 
    ],

    eventEndTime: [
      // Add 2 hours to current time
      new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString(), 
    ],
    dressCode: [
      { gender: 'male' },
      { gender: 'female' },
      { gender: 'transgender' },
      { gender: 'non-binary' },
      { gender: 'genderqueer' },
      { gender: 'genderfluid' },
    ],

    rsvpDeadline: {
      // Yesterday's date
      date: [new Date(new Date().getTime() - 24 * 60 * 60 * 1000)], 
      time: new Date().toLocaleTimeString(),
    },
    eventEntryCharge: [
      { type: 'couple' },
      { type: 'single' },
      { type: 'group' },
      { type: 'family' },
      { type: 'student' },
      { type: 'vip' },
      { type: 'early bird' },
      { type: 'senior citizen' },
    ],
  };
  return res.status(200).json({
    status: 'success',
    data,
  });
});

// // _______________________________EVENT BOOKING____________________________________
// // Buy ticket

// export const buyTicket = catchAsyncErrors(async (req: Request, res: Response) => {
//   const { eventId, ticketId, quantity } = req.body;
//   const eventRepository = getRepository(Event);

//   // Validate the input
//   if (!eventId || !ticketId) {
//     throw new ErrorHandler("Event ID or Ticket ID is invalid, please retry after login", 404);
//   }

//   // Fetch the event based on eventId
//   const event = await eventRepository.findOne({
//     where: { id: eventId }
//   });

//   if (!event) {
//     throw new ErrorHandler("Event not found", 404);
//   }

//   // Prepare the response data
//   const data = {
//     ticketId,
//     ticketType,
//     ticketPrice,
//     restrictions,
//     quantity,
//     totalPrice
//   };
//   const message = 'Ticket details retrieved successfully';
//   return res.status(200).json({
//     status: 'success',
//     message,
//     data
//   });
// });

// // ticket-order-summery

// export const ticketOrderSummary = catchAsyncErrors(async (req: Request, res: Response) => {
//   const { eventId, ticketId, quantity, userId } = req.body;
//   const eventRepository = getRepository(Event);

//   // Validate input
//   if (!eventId || !ticketId || !quantity || !userId) {
//     throw new ErrorHandler("Event ID, Ticket ID, Quantity, or Customer ID is missing or invalid", 404);
//   }

//   // Fetch the event based on eventId
//   const event = await eventRepository.findOne({
//     where: { id: eventId }
//   });

//   if (!event) {
//     throw new ErrorHandler("Event not found", 404);
//   }

//   // Simulate ticket details (replace this with actual ticket fetching logic)
//   const ticketType = "VIP";
//   const ticketPrice = 500;
//   let grandTotal = 0;

//   // Calculate total and grand total prices
//   const totalPrice = quantity * ticketPrice;
//   grandTotal += totalPrice;
//   const data = {
//     ticketId,
//     ticketType,
//     ticketPrice,
//     quantity,
//     totalPrice,
//     grandTotal
//   };
//   const message = 'Ticket order summary retrieved successfully';
//   return res.status(200).json({
//     status: 'success',
//     message,
//     data
//   });
// });

// payment-success-summery
