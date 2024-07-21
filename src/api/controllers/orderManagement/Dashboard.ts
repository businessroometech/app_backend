import { Request, Response } from 'express';
import { OrderItem } from '@/api/entity/orderManagement/customer/OrderItem';
import { Between } from 'typeorm';
import { format } from 'date-fns';
import { Service } from '@/api/entity/orderManagement/serviceProvider/service/Service';
import { AcceptedService } from '@/api/entity/orderManagement/serviceProvider/service/AcceptedService';
import { RejectedService } from '@/api/entity/orderManagement/serviceProvider/service/RejectedService';
import { InprocessService } from '@/api/entity/orderManagement/serviceProvider/service/InprocessService';
import { CompletedService } from '@/api/entity/orderManagement/serviceProvider/service/CompletedService';

export const BetweenDates = (from: Date | string, to: Date | string) =>
    Between(
        format(typeof from === 'string' ? new Date(from) : from, 'YYYY-MM-DD HH:MM:SS'),
        format(typeof to === 'string' ? new Date(to) : to, 'YYYY-MM-DD HH:MM:SS'),
    );

export const getYourServices = async (req: Request, res: Response) => {
    try {
        const { type, serviceStatus, priceStart, priceEnd, dateStart, dataEnd, serviceCategory } = req.body;

        // filter
        const services = await OrderItem.find({
            where: {
                type,
                serviceStatus,
                deliveryDate: BetweenDates(dateStart, dataEnd),
                price: Between(priceStart, priceEnd)
            },
            relations: ['Service']
        });

        const filteredServices = services.filter(orderItem => serviceCategory.includes(orderItem.service.category));

        res.status(200).json({
            status: 'success',
            message: 'Successfully fetched the services',
            data: {
                services: filteredServices,
            },
        });

    } catch (error) {
        console.log("Error fetching services :", error);
        res.status(500).json({ status: "error", message: "Something went wrong !" });
    }
}

export const addService = async (req: Request, res: Response) => {
    try {
        const { providerId, category, description, price, duration, status, createdBy, updatedBy } = req.body;

        const service = await Service.create({
            providerId: providerId,
            category: category,
            description: description,
            price: price,
            duration: duration,
            status: status,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system',
        }).save();

        res.status(201).json({ status: "success", message: "Service added successfully", data: { service } });
    } catch (error) {
        console.log("Cannot add service :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
};

// accept the service
export const acceptService = async (req: Request, res: Response) => {
    try {
        const { providerId, serviceId, orderId, orderItemId, note, createdBy, updatedBy } = req.body;

        const acceptedService = await AcceptedService.create({
            providerId: providerId,
            serviceId: serviceId,
            orderId: orderId,
            orderItemId: orderItemId,
            note: note,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system',
        }).save();

        const orderItem = await OrderItem.findOne({ where: { orderId } });
        if (!orderItem) {
            res.status(500).json({ status: "error", message: "OrderItem not found" });
            return;
        }

        orderItem!.serviceStatus = "Accepted";
        orderItem.save();

        res.status(201).json({ status: "success", message: "Service accepted successfully", data: { acceptedService } });
    } catch (error) {
        console.log("Cannot accept service :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
};

// reject the service
export const rejectService = async (req: Request, res: Response) => {
    try {
        const { providerId, serviceId, orderId, orderItemId, reason, createdBy, updatedBy } = req.body;

        const rejectedService = await RejectedService.create({
            providerId: providerId,
            serviceId: serviceId,
            orderId: orderId,
            orderItemId: orderItemId,
            reason: reason,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system',
        }).save();

        const orderItem = await OrderItem.findOne({ where: { orderId } });
        if (!orderItem) {
            res.status(500).json({ status: "error", message: "OrderItem not found" });
            return;
        }

        orderItem!.serviceStatus = "Rejected";
        orderItem.save();

        res.status(201).json({ status: "success", message: "Service rejected successfully", data: { rejectedService } });
    } catch (error) {
        console.log("Cannot accept service :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
}

export const generateStartOtp = () => {

}

// start the service
export const startService = async (req: Request, res: Response) => {
    try {
        const { otp, providerId, serviceId, orderId, orderItemId, note, createdBy, updatedBy } = req.body;

        // --------------------------verify otp

        // if otp verified add to InProcess
        const inprocessService = await InprocessService.create({
            providerId: providerId,
            serviceId: serviceId,
            orderId: orderId,
            orderItemId: orderItemId,
            note: note,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system',
        }).save();

        const orderItem = await OrderItem.findOne({ where: { orderId } });
        if (!orderItem) {
            res.status(500).json({ status: "error", message: "OrderItem not found" });
            return;
        }

        orderItem!.serviceStatus = "InProcess";
        orderItem.save();

        await AcceptedService.delete({ orderId, providerId, serviceId, orderItemId });

        res.status(201).json({ status: "success", message: "Service InProcess", data: { inprocessService } });
    } catch (error) {
        console.log("Service started :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
}

// end the service
export const endService = async (req: Request, res: Response) => {
    try {
        const { otp, providerId, serviceId, orderId, orderItemId, note, createdBy, updatedBy } = req.body;

        //---------------------- verify otp

        // if otp verified add to InProcess
        const completedService = await CompletedService.create({
            providerId: providerId,
            serviceId: serviceId,
            orderId: orderId,
            orderItemId: orderItemId,
            note: note,
            createdBy: createdBy || 'system',
            updatedBy: updatedBy || 'system',

        }).save();

        const orderItem = await OrderItem.findOne({ where: { orderId } });
        if (!orderItem) {
            res.status(500).json({ status: "error", message: "OrderItem not found" });
            return;
        }

        orderItem!.serviceStatus = "Completed";
        orderItem.save();

        await InprocessService.delete({ orderId, providerId, serviceId, orderItemId });

        res.status(201).json({ status: "success", message: "Service completed", data: { completedService } });
    } catch (error) {
        console.log("Service ended :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
}