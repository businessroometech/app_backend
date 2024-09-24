import express from 'express';

import {
    // addBooking,
    addToCart,
    // removeFromCart,
    // checkout,
    // rescheduleOrderItemBooking,
    // cancelOrderItemBooking,
    getProvidedServicesByCategoryAndSubCategory,
    getAvailableTimeSlots,
    addOrUpdateAddress,
    getAllAddresses,
    fetchCartItem,
    convertCartToOrder,
    cancelOrderItemBooking,
    rescheduleOrder,
    fetchOrderHistory
} from '@/api/controllers/orderManagement/Customer';

const Router = express.Router();

// Router.post('/add-bookings', addBooking);
Router.post('/providers', getProvidedServicesByCategoryAndSubCategory);
Router.post('/timeSlots/:date', getAvailableTimeSlots);

Router.post('/order-history', fetchOrderHistory)

Router.post('/get-address', getAllAddresses)
Router.post('/add-or-update-address', addOrUpdateAddress);

Router.post('/add-to-cart', addToCart);
Router.post('/get-cart-item', fetchCartItem);
Router.post('/cart-to-order', convertCartToOrder);
Router.post('/reschedule', rescheduleOrder);
Router.post('/cancel', cancelOrderItemBooking);

// Router.post('/remove-from-cart', removeFromCart);
// Router.post('/checkout', checkout);

export default Router;
