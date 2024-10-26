import {
  createEvents,
  createOrUpdateEvent,
  deleteTicket,
  deleteUserEvent,
  eventByDetails,
  eventDetailsOptions,
  getNearEvent,
  getPopularEvents,
  getTicket,
  getTicketList,
  getUserEvent,
  updateTicket,
} from '@/api/controllers/events/eventController';
import express from 'express';

const Router = express.Router();

Router.get('/create-event', createEvents);

// ticket
Router.post('/update-ticket', updateTicket);
Router.post('/get-ticket-list', getTicketList); // on event Id
Router.post('/get-ticket', getTicket); //on ticket id
Router.post('/delete-ticket', deleteTicket); // on ticket id

// Event
Router.post('/create-event', createOrUpdateEvent);
Router.post('/get-near-events', getNearEvent);
Router.post('/event-details', eventByDetails);
Router.post('/get-master-data', eventDetailsOptions);
Router.post('/get-popular-events', getPopularEvents);
Router.post('/get-user-event   ', getUserEvent);
Router.post('delete-user-event', deleteUserEvent);

// EVENT BOOKING

export default Router;
