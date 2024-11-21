import { BookedEvent, getBookedEventDetails } from '@/api/controllers/event/BookedEventController';
import {
  cancelCreatedEvent,
  CreatedEvent,
  getCreatedEventDetails,
  getEventParticipants,
  postSendEventInviation,
  rescheduleCreatedEvent,
} from '@/api/controllers/event/CreateEventController';
import {
  getAllCreatedDraft,
  getDraftDetails,
  //   postCreatedEventDraft,
} from '@/api/controllers/event/DraftEventController';
import {
  bookingTicket,
  getBookedAllTicket,
  getBookedTicketDetails,
  getCreatedAllTicket,
  getCreatedTicketDetails,
} from '@/api/controllers/event/TicketEventController';
import { authenticate } from '@/api/middlewares/auth/Authenticate';
import express from 'express';

const Router = express.Router();

// CREATED EVENT
Router.post('/created/get-all-event', CreatedEvent);
Router.post('/created/get-event-details', getCreatedEventDetails);
Router.post('/created/cancel', cancelCreatedEvent);
Router.post('/created/reschedule', rescheduleCreatedEvent);
Router.post('/created/invite/participants', getEventParticipants);
Router.post('/created/invite/send', postSendEventInviation);

// BOOKED EVENT
Router.post('/booking/event',bookingTicket)
Router.post('/booked/get-all-booked-event', BookedEvent);
Router.post('/booked/get-booked-details', getBookedEventDetails);

// TICKET
Router.post('/created/ticket/get-booked', getCreatedAllTicket);
Router.post('/created/ticket/ticket-details', getCreatedTicketDetails);
Router.post('/booked/ticket/get-booked', getBookedAllTicket);
Router.post('/booked/ticket/ticket-details', getBookedTicketDetails);

// DRAFT
// Router.post('/created/create-draft', postCreatedEventDraft);
Router.post('/created/draft/all-draft', getAllCreatedDraft);
Router.post('/created/draft/draft-details', getDraftDetails);

export default Router;
