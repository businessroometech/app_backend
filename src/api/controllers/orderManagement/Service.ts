import { Request, Response } from 'express';
import { ServiceJob } from '@/api/entity/orderManagement/serviceProvider/serviceJob/ServiceJob';
import { Between, In } from 'typeorm';
import { format, isValid } from 'date-fns';
// import { Service } from '@/api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { OrderItemBooking } from '@/api/entity/orderManagement/customer/OrderItemBooking';
import { RejectedServiceJob } from '@/api/entity/orderManagement/serviceProvider/serviceJob/RejectedServiceJob';

// export const BetweenDates = (from: Date | string, to: Date | string) => {
//     const formattedFrom = format(new Date(from), 'yyyy-MM-dd HH:mm:ss');
//     const formattedTo = format(new Date(to), 'yyyy-MM-dd HH:mm:ss');
//     return Between(formattedFrom, formattedTo);
// };

export const BetweenDates = (from: Date | string, to: Date | string) => {
    console.log(from, to);
    const parsedFrom = new Date(from);
    const parsedTo = new Date(to);

    if (!isValid(parsedFrom) || !isValid(parsedTo)) {
        throw new RangeError('Invalid date value');
    }

    const formattedFrom = format(parsedFrom, 'yyyy-MM-dd HH:mm:ss');
    const formattedTo = format(parsedTo, 'yyyy-MM-dd HH:mm:ss');
    return Between(formattedFrom, formattedTo);
};

export const getYourServices = async (req: Request, res: Response) => {
    try {
        const {
            status,
            priceStart = '0',   // Default value
            priceEnd = '100000', // Default value
            dateStart = '1970-01-01T00:00:00.000Z', // Epoch start date as ISO string
            dateEnd = new Date().toISOString(),    // Current date as ISO string
            subCategory,
            page = '1',    // Default to first page
            limit = '10'   // Default limit
        } = req.query;

        console.log(subCategory);

        const parsedPriceStart = parseFloat(priceStart as string);
        const parsedPriceEnd = parseFloat(priceEnd as string);
        const parsedPage = parseInt(page as string);
        const parsedLimit = parseInt(limit as string);

        let whereClause: any = {
            status: status as string,
            orderItemBooking: {
                deliveryDate: BetweenDates(dateStart as string, dateEnd as string),
                price: Between(parsedPriceStart, parsedPriceEnd),
            },
        };

        if (subCategory) {
            const subCategories = (subCategory as string).split(',');
            console.log(subCategories);
            whereClause.orderItemBooking.providedService = {
                subCategory: {
                    subCategoryName: In(subCategories)
                }
            };
        }

        const [jobs, total] = await ServiceJob.findAndCount({
            where: whereClause,
            skip: (parsedPage - 1) * parsedLimit,
            take: parsedLimit,
            relations: [
                'orderItemBooking',
                'orderItemBooking.providedService',
                'orderItemBooking.providedService.subCategory',
            ],
        });

        res.status(200).json({
            status: 'success',
            message: 'Successfully fetched the services',
            data: {
                services: jobs,
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.ceil(total / parsedLimit),
            },
        });

    } catch (error) {
        console.error("Error fetching services:", error);
        if (error instanceof RangeError) {
            res.status(400).json({ status: "error", message: error.message });
        } else {
            res.status(500).json({ status: "error", message: "Something went wrong!" });
        }
    }
};


// export const addService = async (req: Request, res: Response) => {
//     try {
//         const { serviceProviderId, sectorId, categoryId, name, description, price, per, status, createdBy, updatedBy } = req.body;

//         const service = await Service.create({
//             serviceProviderId: serviceProviderId,
//             sectorId,
//             categoryId,
//             name: name,
//             description: description,
//             price: price,
//             per: per,
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
export const acceptService = async (req: Request, res: Response) => {
    try {
        const { orderItemBookingId } = req.body;

        const serviceJob = await ServiceJob.findOne({ where: { orderItemBookingId } });
        if (!serviceJob) {
            res.status(404).json({ status: "error", message: "ServiceJob not found" });
            return;
        }

        const orderItemBooking = await OrderItemBooking.findOne({ where: { id: orderItemBookingId } });
        if (!orderItemBooking) {
            res.status(404).json({ status: "error", message: "OrderItemBooking not found" });
            return;
        }

        serviceJob.status = "Accepted";
        await serviceJob.save();

        orderItemBooking.status = "Assigned";
        await orderItemBooking.save();

        res.status(200).json({ status: "success", message: "Service accepted successfully", data: { serviceJob, orderItemBooking } });
    } catch (error) {
        console.log("Cannot accept service :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
};

// reject the service
export const rejectService = async (req: Request, res: Response) => {
    try {
        const { orderItemBookingId, reason, updatedBy } = req.body;

        const serviceJob = await ServiceJob.findOne({ where: { orderItemBookingId } });
        if (!serviceJob) {
            res.status(404).json({ status: "error", message: "ServiceJob not found" });
            return;
        }

        const orderItemBooking = await OrderItemBooking.findOne({ where: { id: orderItemBookingId } });
        if (!orderItemBooking) {
            res.status(404).json({ status: "error", message: "OrderItemBooking not found" });
            return;
        }

        serviceJob.status = "Rejected";
        serviceJob.reasonIfRejected = reason;
        serviceJob.updatedBy = updatedBy || 'system';
        await serviceJob.save();

        orderItemBooking.status = "Rejected";
        await orderItemBooking.save();

        res.status(200).json({ status: "success", message: "Service rejected successfully", data: { serviceJob, orderItemBooking } });
    } catch (error) {
        console.log("Cannot reject service :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
};

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