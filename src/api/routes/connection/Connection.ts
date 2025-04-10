import {
  ConnectionController,
  ConnectionsSuggestionController,
  getUserConnectionRequests,
  getUserConnections,
  removeConnection,
  sendConnectionRequest,
  unsendConnectionRequest,
  updateConnectionStatus,
} from '@/api/controllers/connection/Connections';
import { authenticate } from '@/api/middlewares/auth/Authenticate';
import { connectionRestrict } from '@/api/middlewares/auth/Authenticate';
import express from 'express';

const Router = express.Router();

Router.post('/send-connection-request', authenticate, connectionRestrict, sendConnectionRequest);
Router.post('/update-connection-status', authenticate, updateConnectionStatus);
Router.get('/get-connection-list', authenticate, getUserConnections);
Router.delete('/remove-connection/:connectionId', authenticate, removeConnection);
Router.post('/unsend-connection-request', authenticate, unsendConnectionRequest);
Router.get('/get-connection-request', authenticate, getUserConnectionRequests);
Router.get('/get-connection-suggest', authenticate, ConnectionsSuggestionController);
Router.get('/get-connection-status/:status', authenticate, ConnectionController.fetchUserConnectionsStatus);

export default Router;
