// import { Request, Response } from 'express';
// import { OrderItemBooking } from '@/api/entity/orderManagement/customer/OrderItemBooking';
// import { Between } from 'typeorm';
// import { format } from 'date-fns';
// import { Service } from '@/api/entity/orderManagement/serviceProvider/service/Service';

// export const BetweenDates = (from: Date | string, to: Date | string) =>
//     Between(
//         format(typeof from === 'string' ? new Date(from) : from, 'YYYY-MM-DD HH:MM:SS'),
//         format(typeof to === 'string' ? new Date(to) : to, 'YYYY-MM-DD HH:MM:SS'),
//     );

// export const getYourServices = async (req: Request, res: Response) => {
//     try {
//         const { type, serviceStatus, priceStart, priceEnd, dateStart, dataEnd, serviceCategory, page, limit } = req.body;

//         // filter
//         const [services, total] = await OrderItemBooking.findAndCount({
//             where: {
//                 type,
//                 serviceStatus,
//                 deliveryDate: BetweenDates(dateStart, dataEnd),
//                 price: Between(priceStart, priceEnd)
//             },
//             relations: ['Service'],
//             skip: (page - 1) * limit,
//             take: limit,
//         });

//         const filteredServices = services.filter(orderItem => serviceCategory.includes(orderItem.service.category));

//         res.status(200).json({
//             status: 'success',
//             message: 'Successfully fetched the services',
//             data: {
//                 services: filteredServices,
//                 total,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(total / limit),
//             },
//         });

//     } catch (error) {
//         console.log("Error fetching services :", error);
//         res.status(500).json({ status: "error", message: "Something went wrong !" });
//     }
// }

// export const addService = async (req: Request, res: Response) => {
//     try {
//         const { providerId, category, description, price, duration, status, createdBy, updatedBy } = req.body;

//         const service = await Service.create({
//             providerId: providerId,
//             category: category,
//             description: description,
//             price: price,
//             duration: duration,
//             status: status,
//             createdBy: createdBy || 'system',
//             updatedBy: updatedBy || 'system',
//         }).save();

//         res.status(201).json({ status: "success", message: "Service added successfully", data: { service } });
//     } catch (error) {
//         console.log("Cannot add service :", error);
//         res.status(500).json({ status: "error", message: 'Something went wrong' });
//     }
// };

// // accept the service
// export const acceptService = async (req: Request, res: Response) => {
//     try {
//         const { orderId, orderItemId } = req.body;

//         const orderItem = await OrderItem.findOne({ where: { orderId, id: orderItemId } });
//         if (!orderItem) {
//             res.status(500).json({ status: "error", message: "OrderItem not found" });
//             return;
//         }

//         orderItem!.serviceStatus = "Accepted";
//         orderItem.save();

//         res.status(201).json({ status: "success", message: "Service accepted successfully", data: { orderItem } });
//     } catch (error) {
//         console.log("Cannot accept service :", error);
//         res.status(500).json({ status: "error", message: 'Something went wrong' });
//     }
// };

// // reject the service
// export const rejectService = async (req: Request, res: Response) => {
//     try {
//         const { orderId, orderItemId, reason } = req.body;

//         const orderItem = await OrderItem.findOne({ where: { orderId, id: orderItemId } });
//         if (!orderItem) {
//             res.status(500).json({ status: "error", message: "OrderItem not found" });
//             return;
//         }

//         orderItem!.serviceStatus = "Rejected";
//         orderItem!.serviceStatusNote = reason;
//         orderItem.save();

//         res.status(201).json({ status: "success", message: "Service rejected successfully", data: { orderItem } });
//     } catch (error) {
//         console.log("Cannot accept service :", error);
//         res.status(500).json({ status: "error", message: 'Something went wrong' });
//     }
// }

// export const generateStartOtp = () => {

// }

// // start the service
// export const startService = async (req: Request, res: Response) => {
//     try {
//         const { orderId, orderItemId } = req.body;

//         // --------------------------verify otp

//         const orderItem = await OrderItem.findOne({ where: { orderId, id: orderItemId } });
//         if (!orderItem) {
//             res.status(500).json({ status: "error", message: "OrderItem not found" });
//             return;
//         }

//         orderItem!.serviceStatus = "InProcess";
//         orderItem.save();

//         res.status(201).json({ status: "success", message: "Service InProcess", data: { orderItem } });
//     } catch (error) {
//         console.log("Service started :", error);
//         res.status(500).json({ status: "error", message: 'Something went wrong' });
//     }
// }

// // end the service
// export const endService = async (req: Request, res: Response) => {
//     try {
//         const { orderId, orderItemId } = req.body;

//         //---------------------- verify otp

//         // if otp verified add to InProcess
//         const orderItem = await OrderItem.findOne({ where: { orderId, id: orderItemId } });
//         if (!orderItem) {
//             res.status(500).json({ status: "error", message: "OrderItem not found" });
//             return;
//         }

//         orderItem!.serviceStatus = "Completed";
//         orderItem.save();

//         res.status(201).json({ status: "success", message: "Service completed", data: { orderItem } });
//     } catch (error) {
//         console.log("Service ended :", error);
//         res.status(500).json({ status: "error", message: 'Something went wrong' });
//     }
// }