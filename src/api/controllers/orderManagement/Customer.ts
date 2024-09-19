import { Request, Response } from 'express';
import { Cart } from '../../entity/orderManagement/customer/Cart';
import { CartItemBooking } from '../../entity/orderManagement/customer/CartItemBooking';
import { Order } from '../../entity/orderManagement/customer/Order';
import { OrderItemBooking } from '../../entity/orderManagement/customer/OrderItemBooking';
import { CancelledBooking } from '@/api/entity/orderManagement/customer/CancelledBooking';
import { RescheduledBooking } from '@/api/entity/orderManagement/customer/RescheduledBooking';
import { ServiceJob } from '@/api/entity/orderManagement/serviceProvider/serviceJob/ServiceJob';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { ProvidedService } from '@/api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { Category } from '@/api/entity/sector/Category';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { AppDataSource } from '@/server';
import { BusinessDetails } from '@/api/entity/profile/business/BusinessDetails';
import { EducationalDetails } from '@/api/entity/profile/educational/other/EducationalDetails';
import { Service } from '@/api/entity/sector/Service';
import { UserAddress } from '@/api/entity/user/UserAddress';



// ----------------------------------------------** IMP ** NEED TO ADD ACID PROPERTIES------------------------------------------


//--------------------- FOR FIRST CUT-------------------

// export const addBooking = async (req: Request, res: Response) => {
//     try {

//         const { sectorId, customerId, serviceProviderId, providedServiceId, price, description, deliveryDate, deliveryTime, deliveryAddress, additionalNote, createdBy, updatedBy } = req.body;

//         const order = await Order.create({
//             customerId: customerId,
//             totalAmount: price,
//             totalItems: 1,
//             createdBy: 'system' || createdBy,
//             updatedBy: 'system' || updatedBy
//         }).save();

//         const sector = await Sector.findOne({ where: { id: sectorId } });
//         const user = await UserLogin.findOne({ where: { id: customerId } });

//         const orderItemBooking = OrderItemBooking.create({
//             orderId: order.id,
//             sectorId: sectorId,
//             customerId: customerId,
//             serviceProviderId: serviceProviderId,
//             providedServiceId: providedServiceId,
//             status: 'Pending',
//             note: additionalNote,
//             price: price,
//             deliveryDate: deliveryDate,
//             deliveryTime: deliveryTime,
//             deliveryAddress: deliveryAddress,
//             additionalNote: additionalNote,
//             createdBy: 'system' || createdBy,
//             updatedBy: 'system' || updatedBy,
//         });

//         // Assign relations after creation
//         orderItemBooking.sector = sector!;
//         orderItemBooking.user = user!;

//         await orderItemBooking.save();

//         const providedService = await ProvidedService.findOne({ where: { id: providedServiceId } })
//         const category = await Category.findOne({ where: { id: providedService?.categoryId } });
//         const customerPersonalDetails = await PersonalDetails.findOne({ where: { sectorId: sectorId, userId: customerId } });

//         const serviceJob = await ServiceJob.create({
//             orderItemBookingId: orderItemBooking.id,
//             jobId: orderItemBooking.OrderItemId,
//             customerId: customerId,
//             serviceProviderId: serviceProviderId,
//             status: 'Pending',
//             description: description || providedService?.bio,
//             note: additionalNote,
//             serviceCategory: category?.categoryName,
//             price: price,
//             deliveryDate: deliveryDate,
//             deliveryTime: deliveryTime,
//             deliveryAddress: deliveryAddress,
//             customerName: customerPersonalDetails?.fullName,
//             customerMobileNumber: customerPersonalDetails?.mobileNumber,
//             createdBy: 'system' || createdBy,
//             updatedBy: 'system' || updatedBy
//         }).save();

//         res.status(201).json({ status: "status", message: "Booking created", data: { order, orderItemBooking, serviceJob } });

//     } catch (error) {
//         res.status(500).json({ status: "error", message: 'Error adding orderBooking ', error });
//     }

// }

export const getProvidedServicesByCategoryAndSubCategory = async (req: Request, res: Response) => {
    try {
        const { categoryId, subCategoryId } = req.params;
        const { serviceName, minPrice, maxPrice, city } = req.query; // Get query parameters

        const providedServiceRepository = AppDataSource.getRepository(ProvidedService);
        const serviceRepository = AppDataSource.getRepository(Service);

        let providedServicesQuery = providedServiceRepository
            .createQueryBuilder('providedService')
            .leftJoinAndSelect('providedService.category', 'category')
            .leftJoinAndSelect('providedService.subCategory', 'subCategory')
            .leftJoin(UserLogin, 'userLogin', 'userLogin.id = providedService.serviceProviderId')

            // Conditionally join and map personalDetails for Individual userType
            .leftJoinAndMapOne(
                'providedService.personalDetails',
                PersonalDetails,
                'personalDetails',
                'personalDetails.userId = userLogin.id AND userLogin.userType = :individual',
                { individual: 'Individual' }
            )

            // Conditionally join and map businessDetails for Business userType
            .leftJoinAndMapOne(
                'providedService.businessDetails',
                BusinessDetails,
                'businessDetails',
                'businessDetails.userId = userLogin.id AND userLogin.userType = :business',
                { business: 'Business' }
            )
            .where('providedService.categoryId = :categoryId', { categoryId })
            .andWhere('providedService.subCategoryId = :subCategoryId', { subCategoryId })

        if (minPrice && maxPrice) {
            providedServicesQuery.andWhere('providedService.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice });
        }
        if (city) {
            providedServicesQuery.andWhere(
                `(userLogin.userType = :individual AND personalDetails.currentAddress->>'city' = :city) 
                 OR (userLogin.userType = :business AND businessDetails.currentAddress->>'city' = :city)`,
                { individual: 'Individual', business: 'Business', city }
            );
        }

        const providedServices = await providedServicesQuery.getMany();

        const allServiceIds = providedServices.flatMap(service => service.serviceIds);

        let services: any[] = [];
        if (allServiceIds.length > 0) {
            const servicesQuery = serviceRepository
                .createQueryBuilder('service')
                .where('service.id IN (:...ids)', { ids: allServiceIds });

            if (serviceName) {
                servicesQuery.andWhere('service.name LIKE :serviceName', { serviceName: `%${serviceName}%` });
            }

            services = await servicesQuery.getMany();
        }

        const servicesMap = new Map(services.map(service => [service.id, service]));

        const enrichedProvidedServices = providedServices.map(providedService => ({
            ...providedService,
            services: providedService.serviceIds
                .map(id => servicesMap.get(id))
                .filter(Boolean)
        })).filter(providedService => providedService.services.length > 0);

        res.status(200).json({
            status: "success",
            message: "Successfully fetched service providers",
            data: { providedServices: enrichedProvidedServices }
        });
    } catch (error) {
        console.error('Error fetching provided services:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

// Fetch time slots

// Define the available 1-hour time slots for a day (in 24-hour format)
const timeSlots = [
    "08:00:00", "09:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00",
    "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00"
];

// Utility function to convert 24-hour format "HH:MM:SS" to 12-hour AM/PM format
const formatTimeTo12Hour = (time: string): string => {
    const [hour, minute] = time.split(':');
    let hourNumber = parseInt(hour, 10);
    const isPM = hourNumber >= 12;
    hourNumber = hourNumber % 12 || 12;  // Convert to 12-hour format
    return `${hourNumber}:${minute} ${isPM ? 'PM' : 'AM'}`;
};

const incrementTimeByOneHour = (time: string): string => {
    let [hour, minute, second] = time.split(':').map(Number);

    hour = hour + 1; // Increment the hour by 1

    // Handle the case when hour exceeds 23 (for a 24-hour clock)
    if (hour === 24) {
        hour = 0;
    }

    // Format hour to always have 2 digits
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;

    return `${hourStr}:${minute < 10 ? `0${minute}` : minute}:${second < 10 ? `0${second}` : second}`;
};

const createTimeSlotPairs = (slots: string[]): { availableSlot: string, startDate: string }[] => {
    const pairs: { availableSlot: string, startDate: string }[] = [];

    for (let i = 0; i < slots.length; i++) {
        const start = formatTimeTo12Hour(slots[i]);
        const end = formatTimeTo12Hour(incrementTimeByOneHour(slots[i])); // Increment the current time by 1 hour

        // Push the object with availableData and startDate
        pairs.push({
            availableSlot: `${start} - ${end}`,
            startDate: slots[i] // Store the raw start time in HH:MM:SS format
        });
    }

    return pairs;
};

// Controller function to get available time slots for a given date
export const getAvailableTimeSlots = async (req: Request, res: Response) => {
    try {
        const { date } = req.params;

        if (!date) {
            return res.status(400).json({ message: 'Please provide a valid delivery date' });
        }

        // Fetch all service jobs for the given delivery date
        const bookedJobs = await ServiceJob.find({
            where: {
                deliveryDate: date as string,  // Convert date to string
                status: 'Accepted',  // Only consider accepted jobs as booked
            },
            select: ['deliveryTime'],  // Only select the deliveryTime field
        });

        // Extract the already booked times from the fetched jobs
        const bookedTimes = bookedJobs.map(job => job.deliveryTime);
        console.log("Booked Times :", bookedTimes);

        // Filter out the booked time slots from the available ones
        const availableSlots = timeSlots.filter(slot => !bookedTimes.includes(slot));
        console.log("Available Times :", availableSlots);

        // Create time slot pairs like "9:00 AM - 10:00 AM"
        const availableSlotPairs = createTimeSlotPairs(availableSlots);

        // Return the available time slot pairs
        return res.status(200).json({ availableSlotPairs });
    } catch (error) {
        console.error('Error fetching available time slots:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// -------------------------Address--------------------------------------

export const addOrUpdateAddress = async (req: Request, res: Response) => {
    try {
        const { addressId, userId, title, addressLine1, addressLine2 = "", city, state, pincode, createdBy, updatedBy } = req.body;

        if (!userId || !title || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        let userAddressRepository = AppDataSource.getRepository(UserAddress);

        let userAddress;
        if (addressId) {
            // Edit existing address
            userAddress = await userAddressRepository.findOne({ where: { id: addressId, userId } });

            if (!userAddress) {
                return res.status(404).json({ message: 'Address not found' });
            }

            userAddress.title = title;
            userAddress.addressLine1 = addressLine1;
            userAddress.addressLine2 = addressLine2;
            userAddress.city = city;
            userAddress.state = state;
            userAddress.pincode = pincode;
            userAddress.updatedBy = userId;
            userAddress.updatedBy = 'system' || updatedBy;
        } else {
            userAddress = userAddressRepository.create({
                userId,
                title,
                addressLine1,
                addressLine2,
                city,
                state,
                pincode,
                createdBy: "system" || createdBy,
            });
        }

        await userAddress.save();

        return res.status(200).json({
            status: "success",
            message: addressId ? 'Address updated successfully' : 'Address added successfully',
            data: { address: userAddress }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllAddresses = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'UserId is required' });
        }

        let userAddressRepository = AppDataSource.getRepository(UserAddress);

        const addresses = await userAddressRepository.find({ where: { userId } });

        if (addresses.length === 0) {
            return res.status(400).json({ status: "error", message: 'No addresses found for this user or maybe user is Invalid' });
        }

        return res.status(200).json({
            status: "success",
            message: 'Addresses retrieved successfully',
            data: { addresses }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

//-----------------------------------------------------------------------------------------

// Add to Cart

export const addToCart = async (req: Request, res: Response) => {
    try {
        const { customerId, sectorId, serviceProviderId, providedServiceId, workDetails, price, deliveryDate, deliveryTime, deliveryAddressId, additionalNote, attachments } = req.body;

        const cartRepository = AppDataSource.getRepository(Cart);
        // Step 1: Check if a Cart already exists for the given customerId
        let cart = await cartRepository.findOne({ where: { customerId } });

        // Step 2: If the Cart does not exist, create a new one
        if (!cart) {
            cart = new Cart();
            cart.customerId = customerId;
            cart.totalAmount = 0; // initialize to 0
            cart.totalItems = 0;   // initialize to 0
            cart.createdBy = 'system'; // or use req.user if you have a user system
            await cart.save();
        }

        // Step 3: Create a new CartItemBooking
        const cartItemBooking = new CartItemBooking();
        cartItemBooking.cartId = cart.id;
        cartItemBooking.sectorId = sectorId;
        cartItemBooking.customerId = customerId;
        cartItemBooking.serviceProviderId = serviceProviderId;
        cartItemBooking.providedServiceId = providedServiceId;
        cartItemBooking.workDetails = workDetails;
        cartItemBooking.price = price;
        cartItemBooking.deliveryDate = deliveryDate;
        cartItemBooking.deliveryTime = deliveryTime;
        cartItemBooking.deliveryAddressId = deliveryAddressId;
        cartItemBooking.additionalNote = additionalNote || '';
        cartItemBooking.attachments = attachments || [];
        cartItemBooking.createdBy = 'system'; // or use req.user if applicable
        await cartItemBooking.save();

        // Step 4: Update the Cart's totalItems and totalAmount
        cart.totalItems += 1;
        cart.totalAmount += price;
        cart.updatedBy = 'system'; // or use req.user if applicable
        await cart.save();

        // Step 5: Return the updated cart
        return res.status(201).json({
            status: "success",
            message: 'Item added to cart successfully',
            data: {
                cart,
                cartItemBooking
            }
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        return res.status(500).json({ message: 'Error adding item to cart', error });
    }
};

// Remove from Cart
// export const removeFromCart = async (req: Request, res: Response) => {
//     const { customerId, cartItemId, cartId, updatedBy } = req.body;

//     try {
//         const cartItem = await CartItemBooking.findOne({ where: { id: cartItemId, cartId, customerId } });

//         if (!cartItem) {
//             return res.status(404).json({ message: 'Cart item not found' });
//         }

//         const cart = await Cart.findOne({ where: { id: cartItem.cartId } });

//         if (cart) {
//             cart.totalAmount -= cartItem.price;
//             cart.totalItems -= 1;
//             cart.updatedBy = updatedBy || 'system';
//             await cart.save();
//         }

//         await cartItem.remove();

//         res.status(200).json({
//             status: "success", message: 'Cart item removed from cart', data: {
//                 cart,
//                 cartItem
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ status: "error", message: 'Error removing from cart' });
//     }
// };

// Checkout
// export const checkout = async (req: Request, res: Response) => {
//     const { cartId } = req.body;

//     try {
//         const cart = await Cart.findOne({ where: { id: cartId } });

//         if (!cart || cart.totalItems === 0) {
//             return res.status(400).json({ message: 'Cart is empty' });
//         }

//         const order = await Order.create({
//             customerId: cart.customerId,
//             totalAmount: cart.totalAmount,
//             totalItems: cart.totalItems,
//             createdBy: 'system',
//             updatedBy: 'system'
//         }).save();

//         const orderItems = [];
//         for (const cartItem of cart.cartItemBookings) {
//             const orderItemBooking = await OrderItemBooking.create({
//                 orderId: order.id,
//                 sectorId: cartItem.sectorId,
//                 customerId: cartItem.customerId,
//                 serviceProviderId: cartItem.serviceProviderId,
//                 serviceId: cartItem.serviceId,
//                 status: 'Pending',
//                 note: cartItem.additionalNote,
//                 price: cartItem.price,
//                 deliveryDate: cartItem.deliveryDate,
//                 deliveryTime: cartItem.deliveryTime,
//                 deliveryAddress: cartItem.deliveryAddress,
//                 additionalNote: cartItem.additionalNote,
//                 createdBy: 'system',
//                 updatedBy: 'system'
//             }).save();
//             orderItems.push(orderItemBooking);

//             await ServiceJob.create({
//                 orderItemBookingId: orderItemBooking.id,
//                 customerId: cartItem.customerId,
//                 serviceProviderId: cartItem.serviceProviderId,
//                 status: 'Pending',
//                 note: cartItem.additionalNote,
//                 createdBy: 'system',
//                 updatedBy: 'system'
//             }).save();
//         }

//         await CartItemBooking.delete({ cartId: cart.id });
//         await Cart.delete({ id: cart.id });

//         res.status(200).json({ status: "success", message: 'Checkout successful', data: { order, orderItems } });
//     } catch (error) {
//         res.status(500).json({ status: "error", message: 'Error during checkout' });
//     }
// };

// Cancel OrderItemBooking
// export const cancelOrderItemBooking = async (req: Request, res: Response) => {
//     const { orderItemId, reason, createdBy, updatedBy } = req.body;

//     try {

//         const orderItemBooking = await OrderItemBooking.findOne({ where: { id: orderItemId } });

//         if (!orderItemBooking) {
//             return res.status(404).json({ message: 'Order item booking not found' });
//         }

//         const cancelledBooking = CancelledBooking.create({
//             orderId: orderItemBooking.orderId,
//             bookingId: orderItemBooking.id,
//             customerId: orderItemBooking.customerId,
//             serviceProviderId: orderItemBooking.serviceProviderId,
//             reason,
//             createdBy: createdBy || 'system',
//             updatedBy: updatedBy || 'system'
//         });

//         await cancelledBooking.save();

//         orderItemBooking.status = 'Cancelled';
//         orderItemBooking.updatedBy = updatedBy || 'system';
//         await orderItemBooking.save();

//         const serviceJob = await ServiceJob.findOne({ where: { orderItemBookingId: orderItemBooking.id } });

//         if (serviceJob) {
//             serviceJob.status = 'Cancelled';
//             serviceJob.updatedBy = updatedBy || 'system';
//             await serviceJob.save();
//         }

//         res.status(200).json({ status: "success", message: 'Order item booking cancelled successfully', data: { orderItemBooking, cancelledBooking } });
//     } catch (error) {
//         res.status(500).json({ message: 'Error cancelling order item booking', error });
//     }
// };

// Reschedule OrderItemBooking
// export const rescheduleOrderItemBooking = async (req: Request, res: Response) => {
//     const { orderItemId, newDeliveryDate, newDeliveryTime, reason, createdBy, updatedBy } = req.body;

//     try {

//         const orderItemBooking = await OrderItemBooking.findOne({ where: { id: orderItemId } });

//         if (!orderItemBooking) {
//             return res.status(404).json({ message: 'Order item booking not found' });
//         }

//         const newOrderItemBooking = await OrderItemBooking.create({
//             orderId: orderItemBooking.orderId,
//             sectorId: orderItemBooking.sectorId,
//             customerId: orderItemBooking.customerId,
//             serviceProviderId: orderItemBooking.serviceProviderId,
//             serviceId: orderItemBooking.serviceId,
//             status: 'Pending',
//             note: orderItemBooking.note,
//             price: orderItemBooking.price,
//             deliveryDate: newDeliveryDate,
//             deliveryTime: newDeliveryTime,
//             deliveryAddress: orderItemBooking.deliveryAddress,
//             additionalNote: orderItemBooking.additionalNote,
//             createdBy: createdBy || 'system',
//             updatedBy: updatedBy || 'system'
//         }).save();

//         const rescheduledBooking = await RescheduledBooking.create({
//             orderId: orderItemBooking.orderId,
//             prevBookingId: orderItemBooking.id,
//             newBookingId: newOrderItemBooking.id,
//             customerId: orderItemBooking.customerId,
//             serviceProviderId: orderItemBooking.serviceProviderId,
//             reason,
//             createdBy: createdBy || 'system',
//             updatedBy: updatedBy || 'system'
//         }).save();

//         orderItemBooking.status = 'Rescheduled';
//         orderItemBooking.updatedBy = updatedBy || 'system';
//         await orderItemBooking.save();

//         const oldServiceJob = await ServiceJob.findOne({ where: { orderItemBookingId: orderItemBooking.id } });

//         if (oldServiceJob) {
//             oldServiceJob.status = 'Rescheduled';
//             oldServiceJob.updatedBy = updatedBy || 'system';
//             await oldServiceJob.save();
//         }

//         await ServiceJob.create({
//             orderItemBookingId: newOrderItemBooking.id,
//             customerId: newOrderItemBooking.customerId,
//             serviceProviderId: newOrderItemBooking.serviceProviderId,
//             status: 'Pending',
//             note: newOrderItemBooking.note,
//             createdBy: createdBy || 'system',
//             updatedBy: updatedBy || 'system'
//         }).save();

//         res.status(200).json({ status: "success", message: 'Order item booking rescheduled successfully', data: { rescheduledBooking, newOrderItemBooking } });
//     } catch (error) {
//         res.status(500).json({ status: "error", message: 'Error rescheduling order item booking' });
//     }
// };


