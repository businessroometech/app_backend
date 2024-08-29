import express from 'express';

import { createOrder, verifyPayment } from "../../controllers/payment/Payment";

const Router = express.Router();

Router.post('/order', createOrder);
Router.post('/verify', verifyPayment);

export default Router;