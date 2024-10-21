import { Request, response, Response } from 'express';
import { getRepository, getTreeRepository } from 'typeorm';
import catchAsyncErrors from '@/api/middlewares/catchAsyncErrors';
import errorHandler from '@/common/middleware/errorHandler';
import { ErrorHandler } from '@/api/middlewares/error';

export const createEvents = async (req: Request, res: Response) => {
  
  res.json({name:'event-start'});
};

// __________________________________event Ticket________________________________

// Function to create or update a ticket based on ticketId
export const createOrUpdateTicket = catchAsyncErrors(async (req: Request, res: Response) => {
  const { ticketId, customerId, eventId, ticketName, eventStartTime, eventEndTime, eventLocation, eventDate, action } = req.body;

  // Get the repository for TicketItem
  const ticketRepository = getRepository(TicketItem);
  let ticket;

  // Ensure customerId and eventId are provided
  if (!customerId || !eventId) {
    throw new ErrorHandler("Customer ID or Event ID not provided", 404);
  }

  // If ticketId is provided, try to find the ticket by its ID
  if (ticketId) {
    ticket = await ticketRepository.findOne(ticketId);

    // If ticket not found, throw an error
    if (!ticket) {
      throw new ErrorHandler('Ticket not found', 404);
    }

    // Check if the provided customerId or eventId do not match the ticket's details
    if (ticket.customerId !== customerId || ticket.eventId !== eventId) {
      throw new ErrorHandler('Customer ID or Event ID does not match the existing ticket', 400);
    }
  } else {
    // If ticketId is not provided, create a new ticket with provided details
    ticket = ticketRepository.create({
      customerId,
      eventId,
      eventDate,
      ticketName,
      eventStartTime,
      eventEndTime,
      eventLocation,
      updatedBy: 'system', 
      status: action === 'confirm' ? 'confirmed' : 'draft',
    });
  }

  // Update the ticket details
  ticket.ticketName = ticketName;
  ticket.eventStartTime = eventStartTime;
  ticket.eventEndTime = eventEndTime;
  ticket.eventLocation = eventLocation;
  ticket.updatedBy = 'system';

  // Update the status based on the action (confirm or draft)
  if (action === 'confirm') {
    ticket.status = 'confirmed';
  } else if (action === 'draft') {
    ticket.status = 'draft';
  }

  // Save the ticket to the database
  await ticketRepository.save(ticket);

  // Return success response indicating if ticket was created or updated
  const message = ticketId ? 'Ticket updated successfully' : 'Ticket created successfully';
  return res.status(200).json({
    status: 'success',
    message,
    data: {
      ticket,
    },
  });
});



// Get Tickets by Customer ID
export const getTicketList = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    // Validate customerId
    if (!customerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer ID is required',
      });
    }

    // Query the database for tickets associated with the customerId
    const tickets = await TicketItem.find({ where: { customerId } });

    // Check if tickets were found
    if (tickets.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No tickets found for this customer ID',
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



// Get Ticket datails 
export const getTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId, customerId, EventID } = req.body;

    // Validate that both ticketID and customerId are provided
    if (!ticketId || !customerId || !EventID ) {
      return res.status(400).json({
        status: 'error',
        message: ' ticketId and customerId are required',
      });
    }

    // Find the ticket by ticketID 
    const ticket = await TicketItem.findOne({ where: { id: ticketId, customerId: customerId } });
    // Check if the ticket was found
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found',
      });
    }else{
    let data =  res.status(200).data(ticketId,	EventId,	customerId,	EventName,	EventstartTime,	EventDate,	EventEndTime,	TicketType,	Price,	Location,	BookingDate,	BookingStatus,	ItemsIncluded,	ImgId)
    }


    return res.status(200).json({
      status: 'success',
      message: 'Ticket retrieved successfully',
      data
    });

  } catch (error) {
    console.error('Error retrieving ticket:', error);
    return res.status(500).json({ message: 'Error retrieving ticket', error });
  }
};

// Delete Ticket
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.body;

    // Validate that ticketId is provided
    if (!ticketId) {
      return res.status(400).json({
        status: "error",
        message: "ticketId is required"
      });
    }

    // Find the ticket by ticketId
    const ticket = await TicketItem.findById({ where: { id: ticketId } });
    
    // Check if the ticket exists
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found"
      });
    }

    // Delete the ticket
    await TicketItem.deleteById(ticketId);

    return res.status(200).json({
      status: "success",
      message: "Ticket deleted",
      ticketId 
    });
    
  } catch (err) {
    console.log(`${err} error deleting ticket`);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message
    });
  }
};

// ______________________event controller__________________________________________

// Create or Update event
// If eventId is provided, find the event and update it. If only customerId is provided, create a new event.
// There are two entities: DraftEvent and Event. If isDraft is true, save the event in DraftEvent, otherwise save in Event.

export const createOrUpdateEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const {  eventId,subcategory, category, eventType, eventName, eventDate, eventStartTime, eventEndTime, location, hostName, 
    guestLimit, inviteOnly, dressCode, entryFees, rsvpDeadlineDate, rsvpDeadlineTime, organizerName, 
    organizerEmail, organizerPhone, ageRestrictions, restrictedAge, eventStatus, eventLink, imgId, 
    customerId, isDraft 
  } = req.body;

  // Choose the correct repository based on the draft status
  const eventRepository = isDraft ? getRepository(DraftEvent) : getRepository(Event);
  let event;

  // If eventId is provided, find the event by its ID
  if (eventId) {
    event = await eventRepository.findOne(eventId);
    if (!event) {
      // If event is not found, throw an error
      throw new ErrorHandler('Event not found', 404);
    }

    // If customerId (userId) doesn't match the event's customerId, throw an error
    if (event.customerId !== customerId) {
      throw new ErrorHandler("User not authorized to update this event", 400);
    }

    // Update the existing event with new details
    event.subcategory= subcategory
    event.category= category
    event.eventType = eventType;
    event.eventName = eventName;
    event.eventDate = eventDate;
    event.eventStartTime = eventStartTime;
    event.eventEndTime = eventEndTime;
    event.location = location;
    event.hostName = hostName;
    event.guestLimit = guestLimit;
    event.inviteOnly = inviteOnly;
    event.dressCode = dressCode;
    event.entryFees = entryFees;
    event.rsvpDeadlineDate = rsvpDeadlineDate;
    event.rsvpDeadlineTime = rsvpDeadlineTime;
    event.organizerName = organizerName;
    event.organizerEmail = organizerEmail;
    event.organizerPhone = organizerPhone;
    event.ageRestrictions = ageRestrictions;
    event.restrictedAge = restrictedAge;
    event.eventStatus = eventStatus;
    event.eventLink = eventLink;
    event.imgId = imgId;

  } else {
    // If eventId is not provided, create a new event
    event = eventRepository.create({
      customerId,
      eventType,
      subcategory,
      category,
      eventName,
      eventDate,
      eventStartTime,
      eventEndTime,
      location,
      hostName,
      guestLimit,
      inviteOnly,
      dressCode,
      entryFees,
      rsvpDeadlineDate,
      rsvpDeadlineTime,
      organizerName,
      organizerEmail,
      organizerPhone,
      ageRestrictions,
      restrictedAge,
      eventStatus,
      eventLink,
      imgId,
    });
  }

  // Save the event to the appropriate table (DraftEvent or Event)
  await eventRepository.save(event);

  // Determine the success message
  const message = eventId ? 'Event updated successfully' : 'Event created successfully';
  if (isDraft) {
    return res.status(200).json({
      status: 'success',
      message: 'Event saved in draft',
      data: {
        event,
      },
    });
  }

  return res.status(200).json({
    status: 'success',
    message,
    data: {
      event,
    },
  });
}); 


// get-near-events 
export const getNearEvent = catchAsyncErrors(async (req: Request, res: Response) => {
  const { category, location } = req.body;

  // Get the event repository
  const eventRepository = getRepository(Event);

  // Check for events that match the provided location and category
  let events = await eventRepository.find({
    where: { 
      location, 
      category: "physical"  // Only matching 'physical' category events
    }
  });

  if (events.length === 0) {
    // If no event is found, throw an error
    throw new ErrorHandler('No events found in this location', 404);
  }

  // Return the response with the found events
  const message = 'Events retrieved successfully';

  return res.status(200).json({
    status: 'success',
    message,
    data: events,  
  });
});


// TODO get popular event 


// event-details by details="about", "schedule"
export const eventByDetails = catchAsyncErrors(async (req: Request, res: Response) => {
  const { details, customerId, eventId } = req.body;

  // Get the event repository
  const eventRepository = getRepository(Event);

  // Validate customerId and eventId
  if (!customerId || !eventId) {
    throw new ErrorHandler("Customer ID or Event ID is incorrect", 404);
  }

  // Fetch the event based on customerId and eventId
  const event = await eventRepository.findOne({
    where: { customerId, eventId }
  });

  if (!event) {
    throw new ErrorHandler("Event not found", 404);
  }

  // Prepare the response based on the 'details' field
  let response: any = {};
  
  if (details === "about") {
    response = {
      aboutEvent: event.aboutEvent,
      organiserId: event.organiserId,
      organiserName: event.organiserName,
      organiserEmail: event.organiserEmail,
      organiserPhone: event.organiserPhone,
      organiserLocation: event.organiserLocation,
      organiserSocialMediaName: event.organiserSocialMediaName,
      organiserSocialMediaLink: event.organiserSocialMediaLink
    };
  } else if (details === "schedule") {
    response = {
      scheduleEventId: event.scheduleEventId,
      scheduleEventTitle: event.scheduleEventTitle,
      scheduleEventTimeStart: event.scheduleEventTimeStart,
      scheduleEventTimeEnd: event.scheduleEventTimeEnd
    };
  } else if (details === "dressCode") {
    response = {
      dressCodeId: event.dressCodeId,
      dressCodeType: event.dressCodeType,
      dressCodeGender: event.dressCodeGender,
      dressCode: event.dressCode
    };
  } else if (details === "restrictions") {
    response = {
      Inclusions: event.Inclusions,
      ageRestrictions: event.ageRestrictions,
      eventEntryType: event.eventEntryType
    };
  } else {
    throw new ErrorHandler("Invalid details type", 400);
  }

  // Add common event details
  const commonDetails = {
    eventType: event.eventType,
    eventName: event.eventName,
    eventDate: event.eventDate,
    eventStartTime: event.eventStartTime,
    eventEndTime: event.eventEndTime,
    rsvpDate: event.rsvpDate,
    rsvpTime: event.rsvpTime,
    eventParticipants: event.eventParticipants
  };

  // Merge the specific and common responses
  const data = { ...commonDetails, ...response };

  // Return the response
  const message = 'Event details retrieved successfully';

  return res.status(200).json({
    status: 'success',
    message,
    data
  });
});

// get-event-details-options in form 
export const eventDetailsOptions = catchAsyncErrors(async (req: Request, res: Response) => {
  const { customerId } = req.body;

  // Validate customerId
  if (!customerId) {
    throw new ErrorHandler("User not available, please retry after login", 404);
  }

  // Define the options for event details
  const data = {
    eventType: ["conference", "seminar", "workshop", "webinar", "meetup", "networking", "trade show", "expo", "festival", "concert", "hackathon", "competition", "fundraiser", "gala", "banquet", "award ceremony", "product launch", "team building", "training", "retreat"],

    eventDate: [
      new Date(), // Current date
      new Date(new Date().setDate(new Date().getDate() + 30)) // 30 days from now as future date
    ],

    eventStartTime: [
      new Date().getHours() === 0 ? 'Full Day' : new Date().toLocaleTimeString() // Show "Full Day" if current time is midnight
    ],

    eventEndTime: [
      new Date(new Date().getTime() + (2 * 60 * 60 * 1000)).toLocaleTimeString() // Add 2 hours to current time
    ],
    dressCode: [
      { gender: "male" },
      { gender: "female" },
      { gender: "transgender" },
      { gender: "non-binary" },
      { gender: "genderqueer" },
      { gender: "genderfluid" }
    ],
    
    rsvpDeadline: {
      date: [new Date(new Date().getTime() - (24 * 60 * 60 * 1000))], // Yesterday's date
      time: new Date().toLocaleTimeString()
    },
    eventEntryCharge: [
      { type: "couple" },
      { type: "single" },
      { type: "group" },
      { type: "family" },
      { type: "student" },
      { type: "vip" },
      { type: "early bird" },
      { type: "senior citizen" }
    ]
    
  };
  return res.status(200).json({
    status: "success",
    data
  });
});

// _______________________________EVENT BOOKING____________________________________
// Buy ticket
// export const buyTicket = catchAsyncErrors(async(req:Request, res:Response)=>{
//   const {eventId, ticketId}  = req.body
//  const eventRepository = getRepository(Event);

//   if (!eventId || !ticketId) {
//     throw new ErrorHandler("evenId or ticket id is invalid , retry ofter login", 404)
//   } else {
//      // Fetch the event based on eventId
//   const event = await eventRepository.findOne({
//     where: { eventId }
//   });

//     const data = res.json({
//       ticketId,ticketType, ticketPrice , restr, 
//     })
//   }
// })