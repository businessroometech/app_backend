import {  getUserConnections, removeConnection, sendConnectionRequest, updateConnectionStatus } from '@/api/controllers/connection/Connections';
import express from 'express';

const Router = express.Router();

Router.post('/send-connection-request', sendConnectionRequest);
Router.post('/update-connection-status', updateConnectionStatus);
Router.post('/get-connection-status', getUserConnections);
Router.post('/remove-connection', removeConnection);
// Router.post('/remove-suggest', ConnectionsSuggestionController);

export default Router;