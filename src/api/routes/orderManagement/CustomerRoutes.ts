import express from 'express';

import {
    addBooking
    // addToCart,
    // removeFromCart,
    // checkout,
    // rescheduleOrderItemBooking,
    // cancelOrderItemBooking,
} from '@/api/controllers/orderManagement/customer';

const Router = express.Router();

Router.post('/customer/add-bookings', addBooking);
// Router.post('/customer/add-to-cart', addToCart);
// Router.post('/customer/remove-from-cart', removeFromCart);
// Router.post('/customer/checkout', checkout);
// Router.post('/customer/reschedule-order-item-booking', rescheduleOrderItemBooking);
// Router.post('/customer/cancel-order-item-booking', cancelOrderItemBooking);

export default Router;
