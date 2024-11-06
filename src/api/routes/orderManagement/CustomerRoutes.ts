import express from 'express';

import {
  // addBooking,
  addToCart,
  // removeFromCart,
  // checkout,
  // rescheduleOrderItemBooking,
  // cancelOrderItemBooking,
  getProvidedServicesByCategoryAndSubCategory,
  getDistinctCitiesBySubCategory,
  getAvailableTimeSlots,
  addOrUpdateAddress,
  deleteAddress,
  getAllAddresses,
  fetchCartItem,
  convertCartToOrder,
  cancelOrderItemBooking,
  rescheduleOrder,
  fetchOrderHistory,
  fetchBookingItem,
} from '@/api/controllers/orderManagement/Customer';
import { getEventServiceProviders, postBookServiceProvider } from '@/api/controllers/event/CreateEventController';
const Router = express.Router();

// Router.post('/add-bookings', addBooking);
Router.post('/providers', getProvidedServicesByCategoryAndSubCategory);
Router.post('/providers/cities', getDistinctCitiesBySubCategory);
Router.post('/timeSlots', getAvailableTimeSlots);

//  ===================================      EVENT MANAGEMENT       ========================================
Router.post('/event/providers', getEventServiceProviders);
Router.post('/event/providers/book', postBookServiceProvider);
//  =========================================================================================================

Router.post('/order-history', fetchOrderHistory);

Router.post('/get-address', getAllAddresses);
Router.post('/add-or-update-address', addOrUpdateAddress);
Router.post('/delete-address', deleteAddress);

Router.post('/add-to-cart', addToCart); 
Router.post('/get-cart-item', fetchCartItem);
Router.post('/get-booked-item', fetchBookingItem);
Router.post('/cart-to-order', convertCartToOrder);
Router.post('/reschedule', rescheduleOrder);
Router.post('/cancel', cancelOrderItemBooking);

// Router.post('/remove-from-cart', removeFromCart);
// Router.post('/checkout', checkout);

export default Router;
