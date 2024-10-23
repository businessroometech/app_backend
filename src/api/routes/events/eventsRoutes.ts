import {
    addOrUpdateTicket,
  createEvents,

  createOrUpdateEvent,

//   createOrUpdateTicket,
//   deleteTicket,
//   eventByDetails,
  eventDetailsOptions,
//   getNearEvent,
//   getTicket,
//   getTicketList,
} from '@/api/controllers/events/eventController';
import express from 'express';

const Router = express.Router();

Router.get('/create-event', createEvents);

// ticket
Router.post('/update-ticket', addOrUpdateTicket);
// Router.post('/get-ticket-list', getTicketList);
// Router.post('/get-ticket', getTicket);
// Router.post('/delete-ticket', deleteTicket);

// // Event
Router.post('/create-event', createOrUpdateEvent);
// Router.post('/get-near-events', getNearEvent);
// Router.post('/event-details', eventByDetails);
Router.post('/get-event-details-options', eventDetailsOptions);

// EVENT BOOKING

export default Router;
