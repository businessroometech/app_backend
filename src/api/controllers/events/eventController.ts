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

// __________________________________event Ticket________________________________

// Add or Update Ticket
export const addOrUpdateTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const {
    ticketId,
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

// Get Tickets by User ID
export const getTicketList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required',
      });
    }

    // Query the database for tickets associated with the userId
    const tickets = await TicketItem.find({ where: { userId } });

    // Check if tickets were found
    if (tickets.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No tickets found for this User ID',
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
      // TODO
      userId,
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

    const user = await validateUserId(userId, res);
    if (!user) {
      // If validation fails, exit the function
      return;
    }


    // Choose the correct repository based on the draft status
    const eventRepository = isDraft ? AppDataSource.getRepository(EventDraft) : AppDataSource.getRepository(Event);
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
        userId,
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
        
      });

     
      
    } else {
      // If eventId is not provided, create a new event
      event = eventRepository.create({
        userId,
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

    }

    // Save the event to the appropriate table (DraftEvent or Event)
    const eventData = await event.save();
    const eventDataId = eventData?.id
     // Handle related entities
     if (dressCodes) {
      const dressCodeRepo = AppDataSource.getRepository(DressCode);
      const mappedDressCodes = await createRelatedEntities({
        repository: dressCodeRepo,
        data: dressCodes,
        eventId: eventDataId,
        mappingFunction: (code: any, eventId: string) => ({
          eventId,
          gender: code.gender,
          dressCode: code.dressCode,
          createdBy: code.createdBy,
          updatedBy: code.updatedBy,
          createdAt: code.createdAt,
        }),
      });
      event.dressCodes = mappedDressCodes;
    }

    if (eventMedia) {
      const eventMediaRepo = AppDataSource.getRepository(EventMedia);
      const mappedEventMedia = await createRelatedEntities({
        repository: eventMediaRepo,
        data: eventMedia,
        eventId: eventDataId,
        mappingFunction: (media: any, eventId: string) => ({
          eventId,
          mediaType: media.mediaType,
          fileUrl: media.fileUrl,
          fileName: media.fileName,
          altText: media.altText,
        }),
      });
      event.eventMedia = mappedEventMedia;
    }

    if (eventRules) {
      const eventRuleRepo = AppDataSource.getRepository(EventRule);
      const mappedEventRules = await createRelatedEntities({
        repository: eventRuleRepo,
        data: eventRules,
        eventId: eventDataId,
        mappingFunction: (rule: any, eventId: string) => ({
          eventId,
          ruleType: rule.ruleType,
          description: rule.description,
          
        }),
      });
      event.eventRules = mappedEventRules;
    }

    if (schedules) {
      const eventScheduleRepo = AppDataSource.getRepository(EventSchedule);
      const mappedSchedules = await createRelatedEntities({
        repository: eventScheduleRepo,
        data: schedules,
        eventId: eventDataId,
        mappingFunction: (schedule: any, eventId: string) => ({
          eventId,
          title: schedule.title,
          description: schedule.description,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          createdBy: schedule.createdBy,
        }),
      });
      event.schedules = mappedSchedules;
    }

    // Determine the success message
    const message = eventId ? 'Event updated successfully' : 'Event created successfully';

    if (isDraft) {
      return res.status(200).json({
        status: 'success',
        message: 'Event saved in draft',
        data: { event },
      });
    }
    await event.save()
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

// get-near-events
// 1st we find all city and state, then match with user city if is equal then show events othwerwise match with match with state if match then show event if not show all physical events 
// show only physical eventType not vertual 
export const getNearEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const { locationId } = req.body;
  // Get repositories
  const eventRepository = AppDataSource.getRepository(Event);
  const addressRepository = AppDataSource.getRepository(UserAddress);
  // Fetch the user's location based on locationId
  const userLocation = await addressRepository.findOne({ where: { id: locationId } });

  // Validate if userLocation exists
  if (!userLocation) {
    throw new ErrorHandler('User location not found', 404);
  }

  const userCity = userLocation.city;
  const userState = userLocation.state;

  // Attempt to match events by city or state
  let locationMatch = await addressRepository.find({ where: { city: userCity } });

  if (!locationMatch) {
    locationMatch = await addressRepository.find({ where: { state: userState } });
  }
  // If no city or state match, fetch all physical events
  let physicalEvents;
  if (locationMatch.length>0) {
    // If a city or state match is found, fetch "Physical" events from the matched location
    physicalEvents = await eventRepository.find({
      where: {
        eventType: "Physical",
        addressId: locationMatch.id, 
      },
    });
  } else {
    // If no location matches, fetch all "Physical" events
    physicalEvents = await eventRepository.find({
      where: {
        eventType: "Physical",
      },
    });
  }

    // If no physical events found, return an error
    if (physicalEvents.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No physical events found',
      });
    }
  
  // Return the matched physical events
  return res.status(200).json({
    status: 'success',
    message: 'Events retrieved successfully',
    data: physicalEvents,
  });
});

// // TODO get popular event
export const getPopularEvents=async(req: Request, res: Response) =>{
  try {
    const events = await Event.createQueryBuilder('event')
      .orderBy('CAST(event.count as SIGNED)', 'DESC') 
      .getMany();

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching sorted events:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
 
export const incrementCounter=async(req: Request, res: Response)=> {
  try {
    const { eventId } = req.body; 

    // Find the event by ID
    const event = await Event.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Increment the count
    if (event.count) {
      event.count = (parseInt(event.count) + 1).toString();
    } else {
      event.count = 1
    }

    // Save the updated event
    await event.save();

    return res.status(200).json({ message: 'Event count incremented successfully', event });

  } catch (error) {
    console.error('Error incrementing event count:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

//TODO not work 
//  get-event-details by details="about", "schedule" 
export const eventByDetails = catchAsyncErrors(async (req: Request, res: Response) => {
  const { details, eventId, userId } = req.body; 

  // Repositories
  const eventRepository = AppDataSource.getRepository(Event);
  const dressCodeRepository = AppDataSource.getRepository(DressCode);
  const scheduleRepository = AppDataSource.getRepository(EventSchedule);
  const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const addressRepository = AppDataSource.getRepository(UserAddress);

  // Fetch the event and related entities concurrently using Promise.all
  const eventPromise = eventRepository.findOne({ where: { id: eventId } });
  const personalDetailsPromise = personalDetailsRepository.findOne({ where: { id: userId } });
  const ticketPromise = ticketRepository.findOne({ where: { id: eventId } });
  
  const [event, personalDetails, ticket] = await Promise.all([eventPromise, personalDetailsPromise, ticketPromise]);

  if (!event) {
    throw new ErrorHandler("Event not found", 404);
  }

  // Fetch the event address if it exists
  const eventAddress =  await addressRepository.findOne({ where: { id: event.addressId } })
    
  // Prepare response based on 'details' field
  let response: any = {};

  if (details === "about") {
    response = {
      aboutEvent: event.description,
      organiserId: event.userId,
      organiserName: personalDetails?.fullName,
      organiserEmail: personalDetails?.emailAddress,
      organiserPhone: personalDetails?.mobileNumber,
      organiserLocation: eventAddress?.addressLine1,
    };
  } else if (details === "schedule") {
    const schedules = await scheduleRepository.find({ where: {eventId: eventId } });
    console.log("schedules", schedules);
    console.log("schedulesId", schedules.id);
    response = {
      scheduleEventId: schedules.id,
      scheduleEventTitle: schedules.title,
      scheduleEventTimeStart: schedules.startTime,
      scheduleEventTimeEnd: schedules.endTime,
    };
  } else if (details === "dressCode") {
    const dressCodes = await dressCodeRepository.find({ where: {eventId: eventId } });
    response = dressCodes.map(dressCode => ({
      dressCodeId: dressCode.id,
      dressCodeType: dressCode.type,
      dressCodeGender: dressCode.gender,
      dressCode: dressCode.dressCode,
    }));
  } else if (details === "restrictions") {
    response = {
      Inclusions: event.inclusions,
      ageRestrictions: event.ageLimit,
      eventEntryType: ticket?.isFree,
    };
  } else {
    throw new ErrorHandler("Invalid details type", 400);
  }

  // Add common event details
  const commonDetails = {
    eventType: event.eventType,
    eventName: event.name,
    eventDate: event.startDatetime,
    eventEnd: event.endDatetime,
    rsvpDate: event.registrationDeadline,
    eventParticipants: event.eventParticipants,
  };

  // Merge the specific and common responses
  const data = { common:commonDetails, details:response };

  // Return the response
  return res.status(200).json({
    status: 'success',
    message: 'Event details retrieved successfully',
    data,
  });
});

// get user event by id
export const getUserEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const { userId } = req.body;

  // Check if userId is provided
  const user = await validateUserId(userId, res);
    if (!user) {
      return;
    }
  // Get the event repository
  const eventRepository = AppDataSource.getRepository(Event);
  // Fetch the events by userId
  const events = await eventRepository.find({
    where: { userId },
  });
  // Check if any events are found
  if (!events || events.length === 0) {
    return res.status(404).json({
      status: 'fail',
      message: 'No events found for this user',
    });
  }
  // Return the events
  return res.status(200).json({
    status: 'success',
    message: 'Events retrieved successfully',
    data: events,
  });
});

// delete-user-event
export const deleteUserEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const { eventId, userId } = req.body;

  const user = await validateUserId(userId, res);
    if (!user) {
      return;
    }

  // Check if eventId 
  if (!eventId) {
    return res.status(400).json({
      status: 'fail',
      message: 'Event ID required',
    });
  }
  // Get the event repository
  const eventRepository = AppDataSource.getRepository(Event);
  // Find the event by eventId and userId to ensure the user has permission to delete it
  const event = await eventRepository.findOne({
    where: { id: eventId, userId: userId },
  });
  // Check if event exists
  if (!event) {
    return res.status(404).json({
      status: 'fail',
      message: 'Event not found or you do not have permission to delete this event',
    });
  }
  // Delete the event
  await eventRepository.remove(event);
  // Return a success response
  return res.status(200).json({
    status: 'success',
    message: 'Event deleted successfully',
  });
});

// get-event-details-options in form
export const eventDetailsOptions = catchAsyncErrors(async (req: Request, res: Response) => {
  const { userId, require } = req.body;

  // Validate user ID
  const user = await validateUserId(userId, res);
  if (!user) {
    return;
  }

  // Initialize the data variable
  let data: any = {};

  // Check the 'require' field and respond accordingly
  switch (require) {
    case "eventType":
      data.eventType = [
        'conference', 'seminar', 'workshop', 'webinar', 'meetup', 'networking', 
        'trade show', 'expo', 'festival', 'concert', 'hackathon', 'competition', 
        'fundraiser', 'gala', 'banquet', 'award ceremony', 'product launch', 
        'team building', 'training', 'retreat',
      ];
      break;
    case "eventDate":
      data.eventDate = [
        new Date(), // Current date
        new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
      ];
      break;
    case "eventStartTime":
      data.eventStartTime = [
        new Date().getHours() === 0 ? 'Full Day' : new Date().toLocaleTimeString(),
      ];
      break;
    case "eventEndTime":
      data.eventEndTime = [
        new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString(), 
      ];
      break;
    case "dressCode":
      data.dressCode = [
        { gender: 'male' },
        { gender: 'female' },
        { gender: 'transgender' },
        { gender: 'non-binary' },
        { gender: 'genderqueer' },
        { gender: 'genderfluid' },
      ];
      break;

    case "rsvpDeadline":
      data.rsvpDeadline = {
        date: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // Yesterday's date
        time: new Date().toLocaleTimeString(),
      };
      break;
    case "eventEntryCharge":
      data.eventEntryCharge = [
        { type: 'couple' },
        { type: 'single' },
        { type: 'group' },
        { type: 'family' },
        { type: 'student' },
        { type: 'vip' },
        { type: 'early bird' },
        { type: 'senior citizen' },
      ];
      break;

    default:
      return res.status(400).json({
        status: 'error',
        message: 'Invalid "require" parameter',
      });
  }
  // Return the response
  return res.status(200).json({
    status: 'success',
    data,
  });
});


// _______________________________EVENT BOOKING____________________________________
// Buy ticket

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
//     throw new ErrorHandler("Event ID, Ticket ID, Quantity, or User ID is missing or invalid", 404);
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
