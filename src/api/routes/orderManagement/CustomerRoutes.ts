import express from 'express';

import {
    addBooking
    // addToCart,
    // removeFromCart,
    // checkout,
    // rescheduleOrderItemBooking,
    // cancelOrderItemBooking,
} from '@/api/controllers/orderManagement/Customer';

const Router = express.Router();

Router.post('/add-bookings', addBooking);
// Router.post('/add-to-cart', addToCart);
// Router.post('/remove-from-cart', removeFromCart);
// Router.post('/checkout', checkout);
// Router.post('/reschedule-order-item-booking', rescheduleOrderItemBooking);
// Router.post('/cancel-order-item-booking', cancelOrderItemBooking);

export default Router;
