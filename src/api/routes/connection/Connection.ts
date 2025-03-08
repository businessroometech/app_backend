import {  ConnectionController, ConnectionsSuggestionController, getUserConnectionRequests, getUserConnections, removeConnection, sendConnectionRequest, unsendConnectionRequest, updateConnectionStatus } from '@/api/controllers/connection/Connections';
import express from 'express';

const Router = express.Router();

Router.post('/send-connection-request', sendConnectionRequest);
Router.post('/update-connection-status', updateConnectionStatus);
Router.get('/get-connection-list/:profileId', getUserConnections);
Router.delete('/remove-connection/:connectionId', removeConnection);
// Router.get('/remove-suggest', ConnectionsSuggestionController);
Router.post('/unsend-connection-request', unsendConnectionRequest);
Router.get('/get-connection-request', getUserConnectionRequests);
Router.get("/get-connection-suggest", ConnectionsSuggestionController)
Router.post("/get-connection-status", ConnectionController.fetchUserConnectionsStatus)

export default Router;