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
  postCreatedEventDraft,
} from '@/api/controllers/event/DraftEventController';
import {
  getBookedAllTicket,
  getBookedTicketDetails,
  getCreatedAllTicket,
  getCreatedTicketDetails,
} from '@/api/controllers/event/TicketEventController';
import { authenticate } from '@/api/middlewares/auth/Authenticate';
import express from 'express';

const Router = express.Router();

// CREATED EVENT
Router.post('/created/get-all-event',authenticate, CreatedEvent);
Router.post('/created/get-event-details',authenticate, getCreatedEventDetails);
Router.post('/created/cancel',authenticate, cancelCreatedEvent);
Router.post('/created/reschedule',authenticate, rescheduleCreatedEvent);
Router.post('/created/invite/participants',authenticate, getEventParticipants);
Router.post('/created/invite/send',authenticate, postSendEventInviation);

// BOOKED EVENT
Router.post('/booked/get-all-booked-event',authenticate, BookedEvent);
Router.post('/booked/get-booked-details',authenticate, getBookedEventDetails);

// TICKET
Router.post('/created/ticket/get-booked',authenticate, getCreatedAllTicket);
Router.post('/created/ticket/ticket-details',authenticate, getCreatedTicketDetails);
Router.post('/booked/ticket/get-booked',authenticate, getBookedAllTicket);
Router.post('/booked/ticket/ticket-details',authenticate, getBookedTicketDetails);

// DRAFT
Router.post('/created/create-draft',authenticate, postCreatedEventDraft);
Router.post('/created/draft/all-draft',authenticate, getAllCreatedDraft);
Router.post('/created/draft/draft-details',authenticate, getDraftDetails);

export default Router;
 