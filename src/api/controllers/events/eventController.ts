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

// ______________________event controller__________________________________________

// Create or Update event
// If eventId is provided, find the event and update it. If only userId is provided, create a new event.
// There are two entities: DraftEvent and Event. If isDraft is true, save the event in DraftEvent, otherwise save in Event.
// also created ticket

export const createOrUpdateEvent = async (req: Request, res: Response) => {
  const validationRules = {
    eventId: { type: 'string' },
    userId: { required: false, type: 'string', minLength: 10 },
    name: { required: false, type: 'string' },
    description: { required: false, type: 'string' },
    eventType: { required: false, type: 'string' },
    category: { required: false, type: 'string' },
    startDatetime: { required: false, type: 'string' },
    endDatetime: { required: false, type: 'string' },
    capacity: { required: false, type: 'number', validate: (value: number) => value > 0 },
    isInviteOnly: { required: false, type: 'boolean' },
    status: { required: false, type: 'string' },
    venueName: { required: false, type: 'string' },
    addressId: { required: false, type: 'string' },
    bannerImageUrl: { required: false, type: 'string' },
    livestreamLink: { required: false, type: 'string' },
    accessCode: { required: false, type: 'string' },
    registrationDeadline: { required: false, type: 'string' },
    schedules: { required: false },
    dressCodes: { required: false },
    eventMedia: { required: false },
    eventRules: { required: false },
    isDraft: { required: true, type: 'boolean' },
    ticketType: { required: false, type: 'string' },
    price: { required: false, type: 'number' },
    quantityAvailable: { required: false, type: 'number' },
    isFree: { required: false, type: 'boolean' },
    inclusions: { required: false, type: 'string' },
  };

  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

  try {
    const {
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
      organizer,
      schedules,
      dressCodes,
      eventMedia,
      eventRules,
      isDraft,
      ticketType,
      price,
      quantityAvailable,
      isFree,
      inclusions,
    } = req.body;

    const user = await validateUserId(userId, res);
    if (!user) {
      return;
    }

    // Choose the correct repository based on the draft status
    const eventRepository = isDraft ? AppDataSource.getRepository(EventDraft) : AppDataSource.getRepository(Event);
    const ticketRepository = AppDataSource.getRepository(Ticket);
    const userRepository = AppDataSource.getRepository(PersonalDetails);

    let event: any;

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
        organizer,
        schedules,
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
        organizer,
        schedules,
      });
    }

    // Save the event to the appropriate table (DraftEvent or Event)
    const eventData = await event.save();
    const eventDataId = eventData?.id;

    let ticket;
    if (!isDraft) {
      ticket = ticketRepository.create({
        eventId: eventDataId,
        ticketType,
        price: isFree ? 0 : price,
        quantityAvailable,
        isFree,
        inclusions,
      });

      ticket = await ticket.save();
    }

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
      return Promise.all(data.map((item) => repository.create(mappingFunction(item, eventId))));
    };

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
        }),
      });
      event.schedules = mappedSchedules;
    }

    if (organizer) {
      const organizerRepo = AppDataSource.getRepository(EventOrganiser);
      const mappedOrganizer = await createRelatedEntities({
        repository: organizerRepo,
        data: [organizer], // Wrap in an array to match the expected input
        eventId: eventDataId,
        mappingFunction: (item: any, eventId: string) => ({
          eventId,
          imgurl: item.imgurl,
          name: item.name,
          phone: item.phone,
          email: item.email,
          socialmedia: organizer.socialMedia,
        }),
      });

      event.organizer = mappedOrganizer;

      if (organizer.socialMedia) {
        const socialMediaRepo = AppDataSource.getRepository(SocialMediaLink);
        const mappedSocialMedia = await createRelatedEntities({
          repository: socialMediaRepo,
          data: organizer.socialMedia,
          eventId: eventDataId,
          mappingFunction: (media: any) => ({
            organizerId: organizer.id,
            platform: media.platform,
            link: media.platform,
          }),
        });

        event.organizer.socialMedia = mappedSocialMedia;
      }
    }

    // Determine the success message
    // const message = eventId ? 'Event updated successfully' : 'Event created successfully';
    // if (isDraft) {
    //   return res.status(201).json({ status: 'success', message });
    // }
    
    const notificationData = {
      notificationType: 'inApp',
      templateName: 'order_accepted_sp',
      recipientId: userId,
      recipientType: 'Events',
      data: {
        'OrderId': event.id,
        X: '3',
      },
    };

    try {
       await NotificationController.sendNotification({ body: notificationData } as Request);
      notificationData.templateName = 'order_accepted_cu';
      notificationData.recipientType = 'Event';
      notificationData.recipientId = userId;
      await NotificationController.sendNotification({ body: notificationData } as Request);

    } catch (notificationError: any) {
      console.error('Order rejected but error sending notification:', notificationError.message || notificationError);
    }

    return res.status(201).json({
      status: 'success',
      message: [`Event ${eventId ? "updated" : "created"} ${isDraft ? "and saved as a draft" : "successfully"}.`],
      data: eventData,
    });

    // return res.status(201).json({ status: 'success', message, data: eventData });
  } catch (error) {
    console.error('Error creating or updating event:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating/updating the event.',
    });
  }
};

// get-near-events
// 1st we find all city and state, then match with user city if is equal then show events othwerwise match with match with state if match then show event if not show all physical events
// show only physical eventType not vertual
export const getNearEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const validationRules = {
    locationId: { type: 'string', minLength: 10 },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

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
  if (locationMatch.length > 0) {
    // If a city or state match is found, fetch "Physical" events from the matched location
    physicalEvents = await eventRepository.find({
      where: {
        eventType: 'Physical',
        addressId: locationMatch.id,
      },
    });
  } else {
    // If no location matches, fetch all "Physical" events
    physicalEvents = await eventRepository.find({
      where: {
        eventType: 'Physical',
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

  for (const event of physicalEvents) {
    await incrementCounter(event.id);
  }
  // Return the matched physical events
  return res.status(200).json({
    status: 'success',
    message: 'Events retrieved successfully',
    data: physicalEvents,
  });
});

// get Popular Events
export const getPopularEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.createQueryBuilder('event').orderBy('CAST(event.count as SIGNED)', 'DESC').getMany();

    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching sorted events:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//TODO not work
//  get-event-details by details="about", "schedule"
export const eventByDetails = catchAsyncErrors(async (req: Request, res: Response) => {
  // const validationRules = {
  //   eventId: {  type: 'string', minLength: 10 },
  //   userId: { require: true, type: 'string', minLength: 10 },
  // };
  // // Request validation start
  // const errors = validateRequestBody(req.body, validationRules);
  // if (errors) {
  //   return res.status(400).json({ errors });
  // }
  // // Request validation end

  const { details, eventId, userId } = req.body;

  // Repositories
  const eventRepository = AppDataSource.getRepository(Event);
  const dressCodeRepository = AppDataSource.getRepository(DressCode);
  const scheduleRepository = AppDataSource.getRepository(EventSchedule);
  const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const addressRepository = AppDataSource.getRepository(UserAddress);
  const organiserRepository = AppDataSource.getRepository(EventOrganiser);

  // Fetch the event and related entities concurrently using Promise.all
  const eventPromise = eventRepository.findOne({ where: { id: eventId } });
  const personalDetailsPromise = personalDetailsRepository.findOne({ where: { id: userId } });
  const ticketPromise = ticketRepository.findOne({ where: { id: eventId } });
  const organisertPromise = organiserRepository.findOne({ where: { eventId } });

  const [event, personalDetails, ticket, organiser] = await Promise.all([
    eventPromise,
    personalDetailsPromise,
    ticketPromise,
    organisertPromise,
  ]);

  if (!event) {
    throw new ErrorHandler('Event not found', 404);
  }

  // Fetch the event address if it exists
  const eventAddress = await addressRepository.findOne({ where: { id: event.addressId } });

  // Prepare response based on 'details' field
  let response: any = {};

  if (details === 'about') {
    response = {
      aboutEvent: event.description,
      organiserId: organiser?.id,
      organiserName: organiser?.name,
      organiserEmail: organiser?.email,
      organiserPhone: organiser?.phone,
      organiserLocation: eventAddress?.addressLine1,
    };
  } 
  else if (details === 'schedule') {
    const schedules = await scheduleRepository.find({ where: { eventId: eventId } });
    console.log('schedules', schedules);
    console.log('schedulesId', schedules.id);
    response = {
      scheduleEventId: schedules.id,
      scheduleEventTitle: schedules.title,
      scheduleEventTimeStart: schedules.startTime,
      scheduleEventTimeEnd: schedules.endTime,
    };
  } 
  else if (details === 'dressCode') {
    const dressCodes = await dressCodeRepository.find({ where: { eventId: eventId } });
    response = dressCodes.map((dressCode) => ({
      dressCodeId: dressCode.id,
      dressCodeType: dressCode.type,
      dressCodeGender: dressCode.gender,
      dressCode: dressCode.dressCode,
    }));
  } else if (details === 'restrictions') {
    response = {
      Inclusions: event.inclusions,
      ageRestrictions: event.ageLimit,
      eventEntryType: ticket?.isFree,
    };
  } else {
    throw new ErrorHandler('Invalid details type', 400);
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
  const data = { common: commonDetails, details: response };

  // Return the response
  return res.status(200).json({
    status: 'success',
    message: 'Event details retrieved successfully',
    data,
  });
});

// get user event by id
export const getUserEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const validationRules = {
    userId: { type: 'string', minLength: 10 },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

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

  
  const ticketRepository = AppDataSource.getRepository(Ticket);
  // Find the event by eventId and userId to ensure the user has permission to delete it
  const ticket = await ticketRepository.findOne({
    where: { eventId },
  });
  
  // Check if event exists
  if (!event) {
    return res.status(404).json({
      status: 'fail',
      message: 'Event not found or you do not have permission to delete this event',
    });
  }
  
  if (ticket) {
    await ticket.remove();
  }

  // Delete the event
  await event.remove();  
 
  // Return a success response
  return res.status(200).json({
    status: 'success',
    message: 'Event with respective Tickets deleted successfully',
  });
});

// Get event details dropdown
export const eventDetailsOptions = catchAsyncErrors(async (req: Request, res: Response) => {
  const { masterdataType } = req.body;
  const dropRepository = AppDataSource.getRepository(Dropdown);
  const dropDown = await dropRepository.find();
  console.log('dropDown', dropDown);

  if (!dropDown || dropDown.length === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Dropdown data not found',
    });
  }
  const dropdownData = dropDown[0];
  let data: any = {};
  switch (masterdataType) {
    case 'eventType':
      data.eventType = dropdownData.eventType;
      break;
    case 'gender':
      data.gender = dropdownData.gender;
      break;
    case 'eventEntryCharge':
      data.eventEntryCharge = dropdownData.entryType;
      break;
    default:
      return res.status(400).json({
        status: 'error',
        message: 'Invalid "masterdataType" parameter',
      });
  }
  return res.status(200).json({
    status: 'success',
    data,
  });
});

// _______________________________EVENT BOOKING____________________________________

// get Bought ticket
export const getBoughtTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const validationRules = { Soldticketid: { type: 'string', minLength: 10 } };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }
  // Request validation end

  const { Soldticketid } = req.body;
  // Validate that ticket ID is provided
  if (!Soldticketid) {
    throw new ErrorHandler('Ticket ID is required', 400);
  }

  const boughtTicketRepository = AppDataSource.getRepository(SoldTicket);
  const boughtTicket = await boughtTicketRepository.find({ where: { id: Soldticketid } });
  console.log('boughtTicket', boughtTicket);
  if (!boughtTicket) {
    throw new ErrorHandler('Ticket not found', 404);
  }
  const ticketRepository = AppDataSource.getRepository(Ticket);
  const ticketId = boughtTicket.ticketId;
  const ticket = await ticketRepository.find({ where: { id: ticketId } });
  if (!ticket) {
    throw new ErrorHandler('Ticket not found', 404);
  }

  return res.status(200).json({
    status: 'success',
    message: 'Ticket retrieved successfully',
    data: [boughtTicket, ticket[0]],
  });
});

// create bought ticket summery
export const createBoughtTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const validationRules = {
    ticketId: { required: true, type: 'string', minLength: 10 },
    transactionId: { required: true, type: 'string', minLength: 10 },
    quantity: { required: true, type: 'number' },
    totalPrice: { required: true, type: 'number' },
    boughtById: { required: true, type: 'string', minLength: 10 },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  } // Request validation end

  const { ticketId, transactionId, quantity, totalPrice, boughtById } = req.body;

  const boughtTicketRepository = AppDataSource.getRepository(SoldTicket);
  const ticketRepository = AppDataSource.getRepository(Ticket);

  // Check if the ticket exists
  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) {
    throw new ErrorHandler('Ticket not found', 404);
  }
  // Check if there's enough quantity available
  if (ticket.quantityAvailable < quantity) {
    throw new ErrorHandler('Not enough tickets available', 400);
  }
  // Create the new sold ticket entry
  const boughtTicket = boughtTicketRepository.create({
    ticketId: ticketId,
    transisterID: transactionId,
    totalQuantity: quantity,
    totalPrice: totalPrice,
    boughtById: boughtById,
  });
  await boughtTicket.save();
  // Update the available quantity of the ticket
  ticket.quantityAvailable -= quantity;
  await ticket.save();
  return res.status(200).json({
    status: 'success',
    message: 'Ticket purchased successfully',
    data: {
      boughtTicket,
      updatedTicket: ticket,
    },
  });
});
