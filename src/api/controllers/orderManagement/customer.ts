import { Request, Response } from 'express';
import { Cart } from '../../entity/orderManagement/customer/Cart';
import { CartItemBooking } from '../../entity/orderManagement/customer/CartItemBooking';
import { Order } from '../../entity/orderManagement/customer/Order';
import { OrderItemBooking } from '../../entity/orderManagement/customer/OrderItemBooking';
import { CancelledBooking } from '@/api/entity/orderManagement/customer/CancelledBooking';
import { RescheduledBooking } from '@/api/entity/orderManagement/customer/RescheduledBooking';

// Add to Cart
export const addToCart = async (req: Request, res: Response) => {
    const { cartId, sectorId, customerId, serviceProviderId, serviceId, price, deliveryDate, deliveryTime, deliveryAddress, additionalNote, createdBy, updatedBy } = req.body;

    try {
        let cart = await Cart.findOne({ where: { id: cartId } });

        if (!cart) {
            cart = await Cart.create({
                customerId,
                totalAmount: 0,
                totalItems: 0,
                createdBy: createdBy || 'system',
                updatedBy: updatedBy || 'system'
            }).save();
        }

        const cartItem = await CartItemBooking.create({
            cartId: cart.id,
            sectorId,
            customerId,
            serviceProviderId,
            serviceId,
            price,
            deliveryDate,
            deliveryTime,
            deliveryAddress,
            additionalNote,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system'
        }).save();

        cart.totalAmount += price;
        cart.totalItems += 1;
        cart.updatedBy = updatedBy || 'system';
        await cart.save();

        res.status(201).json({ status: "status", message: "Added to cart", data: { cart, cartItem } });
    } catch (error) {
        res.status(500).json({ status: "error", message: 'Error adding to cart' });
    }
};

// Remove from Cart
export const removeFromCart = async (req: Request, res: Response) => {
    const { customerId, cartItemId, cartId, updatedBy } = req.body;

    try {
        const cartItem = await CartItemBooking.findOne({ where: { id: cartItemId, cartId, customerId } });

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        const cart = await Cart.findOne({ where: { id: cartItem.cartId } });

        if (cart) {
            cart.totalAmount -= cartItem.price;
            cart.totalItems -= 1;
            cart.updatedBy = updatedBy || 'system';
            await cart.save();
        }

        await cartItem.remove();

        res.status(200).json({
            status: "success", message: 'Cart item removed from cart', data: {
                cart,
                cartItem
            }
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: 'Error removing from cart' });
    }
};

// Checkout
export const checkout = async (req: Request, res: Response) => {
    const { cartId, customerId, sectorId } = req.body;

    try {

        const cart = await Cart.findOne({ where: { id: cartId } });

        if (!cart || cart.totalItems === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const order = await Order.create({
            customerId: cart.customerId,
            totalAmount: cart.totalAmount,
            totalItems: cart.totalItems,
            createdBy: 'system',
            updatedBy: 'system'
        }).save();

        let orderItems;
        for (const cartItem of cart.cartItemBookings) {
            orderItems = OrderItemBooking.create({
                orderId: order.id,
                sectorId: cartItem.sectorId,
                customerId: cartItem.customerId,
                serviceProviderId: cartItem.serviceProviderId,
                serviceId: cartItem.serviceId,
                status: 'Pending',
                note: cartItem.additionalNote,
                price: cartItem.price,
                deliveryDate: cartItem.deliveryDate,
                deliveryTime: cartItem.deliveryTime,
                deliveryAddress: cartItem.deliveryAddress,
                additionalNote: cartItem.additionalNote,
                createdBy: 'system',
                updatedBy: 'system'
            }).save();
        }

        await CartItemBooking.delete({ cartId: cart.id });
        await Cart.delete({ id: cart.id });

        res.status(200).json({ status: "success", message: 'Checkout successful', data: { order, orderItems } });
    } catch (error) {
        res.status(500).json({ status: "error", message: 'Error during checkout' });
    }
};

// Cancel OrderItemBooking
export const cancelOrderItemBooking = async (req: Request, res: Response) => {
    const { orderItemId, reason, createdBy, updatedBy } = req.body;

    try {

        const orderItemBooking = await OrderItemBooking.findOne({ where: { id: orderItemId } });

        if (!orderItemBooking) {
            return res.status(404).json({ message: 'Order item booking not found' });
        }

        const cancelledBooking = CancelledBooking.create({
            orderId: orderItemBooking.orderId,
            bookingId: orderItemBooking.id,
            customerId: orderItemBooking.customerId,
            serviceProviderId: orderItemBooking.serviceProviderId,
            reason,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system'
        });

        await cancelledBooking.save();

        orderItemBooking.status = 'Cancelled';
        orderItemBooking.updatedBy = updatedBy || 'system';
        await orderItemBooking.save();

        res.status(200).json({ status: "success", message: 'Order item booking cancelled successfully', data: { orderItemBooking, cancelledBooking } });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling order item booking', error });
    }
};

// Reschedule OrderItemBooking
export const rescheduleOrderItemBooking = async (req: Request, res: Response) => {
    const { orderItemId, newDeliveryDate, newDeliveryTime, reason, createdBy, updatedBy } = req.body;

    try {

        const orderItemBooking = await OrderItemBooking.findOne({ where: { id: orderItemId } });

        if (!orderItemBooking) {
            return res.status(404).json({ message: 'Order item booking not found' });
        }

        const newOrderItemBooking = await OrderItemBooking.create({
            orderId: orderItemBooking.orderId,
            sectorId: orderItemBooking.sectorId,
            customerId: orderItemBooking.customerId,
            serviceProviderId: orderItemBooking.serviceProviderId,
            serviceId: orderItemBooking.serviceId,
            status: 'Pending',
            note: orderItemBooking.note,
            price: orderItemBooking.price,
            deliveryDate: newDeliveryDate,
            deliveryTime: newDeliveryTime,
            deliveryAddress: orderItemBooking.deliveryAddress,
            additionalNote: orderItemBooking.additionalNote,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system'
        }).save();

        const rescheduledBooking = await RescheduledBooking.create({
            orderId: orderItemBooking.orderId,
            prevBookingId: orderItemBooking.id,
            newBookingId: newOrderItemBooking.id,
            customerId: orderItemBooking.customerId,
            serviceProviderId: orderItemBooking.serviceProviderId,
            reason,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system'
        }).save();

        orderItemBooking.status = 'Rescheduled';
        orderItemBooking.updatedBy = updatedBy || 'system';
        await orderItemBooking.save();

        res.status(200).json({ status: "success", message: 'Order item booking rescheduled successfully', data: { rescheduledBooking, newOrderItemBooking } });
    } catch (error) {
        res.status(500).json({ status: "error", message: 'Error rescheduling order item booking' });
    }
};
