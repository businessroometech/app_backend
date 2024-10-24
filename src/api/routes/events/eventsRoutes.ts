import {
  addOrUpdateTicket,
  createEvents,
  createOrUpdateEvent,
  deleteUserEvent,
  eventByDetails,
  eventDetailsOptions,
  getNearEvent,
  getPopularEvents,
  getUserEvent,
} from '@/api/controllers/events/eventController';
import express from 'express';

const Router = express.Router();

Router.get('/create-event', createEvents);

// ticket
Router.post('/update-ticket', addOrUpdateTicket);
// Router.post('/get-ticket-list', getTicketList);
// Router.post('/get-ticket', getTicket);
// Router.post('/delete-ticket', deleteTicket);

// Event
Router.post('/create-event', createOrUpdateEvent);
Router.post('/get-near-events', getNearEvent);
Router.post('/event-details', eventByDetails);
Router.post('/get-event-details-options', eventDetailsOptions);
Router.post('/get-popular-events', getPopularEvents);
Router.post('/get-user-event   ', getUserEvent);
Router.post('delete-user-event', deleteUserEvent);

// EVENT BOOKING

export default Router;
