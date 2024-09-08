import { Request, Response } from 'express';
import { ServiceJob } from '@/api/entity/orderManagement/serviceProvider/serviceJob/ServiceJob';
import { Between, In } from 'typeorm';
import { format, isValid, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
// import { Service } from '@/api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { OrderItemBooking } from '@/api/entity/orderManagement/customer/OrderItemBooking';
import { ProvidedService } from '@/api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { Service } from '@/api/entity/sector/Service';

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

        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ status: "error", message: "UserId is required" });
            return;
        }

        const parsedPriceStart = parseFloat(priceStart as string);
        const parsedPriceEnd = parseFloat(priceEnd as string);
        const parsedPage = parseInt(page as string);
        const parsedLimit = parseInt(limit as string);

        let whereClause: any = {
            status: status as string,
            serviceProviderId: userId,
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

export const completeService = async (req: Request, res: Response) => {
    try {
        const { orderItemBookingId, updatedBy } = req.body;

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

        serviceJob.status = "Completed";
        serviceJob.updatedBy = updatedBy || 'system';
        await serviceJob.save();

        orderItemBooking.status = "Completed";
        await orderItemBooking.save();

        res.status(200).json({ status: "success", message: "Service completed successfully", data: { serviceJob, orderItemBooking } });
    } catch (error) {
        console.log("Cannot mark service as completed :", error);
        res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
};

//-------------------------------------------------- Service Management-----------------------------------------------------------------------

export const addOrUpdateProvidedService = async (req: Request, res: Response) => {
    try {
        const {
            id,
            userId,
            sectorId,
            categoryId,
            subCategoryId,
            serviceIds,
            experience,
            certificates,
            typeOfProjects,
            projectScaleExpertise,
            typeOfWorkforce,
            typesOfClients,
            price,
            per,
            bio,
            uploadedImageIds,
            isActive,
            updatedBy,
        } = req.body;

        if (!userId) {
            return res.status(400).json({ status: "error", message: "UserId not found" });
        }

        let providedService;

        if (id) {
            providedService = await ProvidedService.findOne({ where: { id } });
            if (!providedService) {
                return res.status(404).json({ status: "error", message: 'ProvidedService not found' });
            }
        } else {
            providedService = new ProvidedService();
            providedService.createdBy = req.body.createdBy || 'system';
        }

        providedService.serviceProviderId = userId;
        if (sectorId !== undefined) providedService.sectorId = sectorId;
        if (categoryId !== undefined) providedService.categoryId = categoryId;
        if (subCategoryId !== undefined) providedService.subCategoryId = subCategoryId;
        if (serviceIds !== undefined) providedService.serviceIds = serviceIds;
        if (experience !== undefined) providedService.experience = experience;
        if (certificates !== undefined) providedService.certificates = certificates;
        if (typeOfProjects !== undefined) providedService.typeOfProjects = typeOfProjects;
        if (projectScaleExpertise !== undefined) providedService.projectScaleExpertise = projectScaleExpertise;
        if (typeOfWorkforce !== undefined) providedService.typeOfWorkforce = typeOfWorkforce;
        if (typesOfClients !== undefined) providedService.typesOfClients = typesOfClients;
        if (price !== undefined) providedService.price = price;
        if (per !== undefined) providedService.per = per;
        if (bio !== undefined) providedService.bio = bio;
        if (uploadedImageIds !== undefined) providedService.uploadedImageIds = uploadedImageIds;
        if (isActive !== undefined) providedService.isActive = isActive;
        providedService.updatedBy = updatedBy || 'system';

        await providedService.save();

        return res.status(201).json({ status: "success", message: "ProvidedService created or updated", data: { providedService } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};

export const getProvidedService = async (req: Request, res: Response) => {
    try {
        const { id, userId } = req.body;
        const { isActive } = req.query;

        if (!userId) {
            return res.status(400).json({ status: "error", message: "UserId not found" });
        }

        let providedService;
        if (id) {
            providedService = await ProvidedService.findOne({
                where: { id, serviceProviderId: userId, ...(isActive && { isActive: isActive === 'true' }) },
                relations: ['category', 'subCategory'],
            });

            // if (!providedService) {
            //     return res.status(404).json({ status: "error", message: 'Provided Service not found' });
            // }

            if (providedService) {
                const serviceDetails = await Service.find({ where: { id: In(providedService.serviceIds) } });
                providedService['services'] = serviceDetails;
            }
        } else {
            const providedServices = await ProvidedService.find({
                where: { serviceProviderId: userId, ...(isActive && { isActive: isActive === 'true' }) },
                relations: ['category', 'subCategory'],
            });

            // if (providedServices.length === 0) {
            //     return res.status(404).json({ status: "error", message: 'Provided Services not found' });
            // }

            for (let providedService of providedServices) {
                const serviceDetails = await Service.find({ where: { id: In(providedService.serviceIds) } });
                providedService['services'] = serviceDetails;
            }

            return res.status(200).json({
                status: "success",
                message: "Provided Services successfully fetched",
                data: { providedServices },
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Provided Service successfully fetched",
            data: { providedService },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};


export const deleteProvidedService = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;

        const providedService = await ProvidedService.findOne({ where: { id } });

        if (!providedService) {
            return res.status(404).json({ status: "error", message: 'ProvidedService not found' });
        }

        await ProvidedService.delete(id);

        return res.status(204).json({ status: "success", message: "ProvidedService successfully deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};


// ---------------------------------------------HOME PAGE----------------------------------------------

export const getServiceJobsBy_Year_Month_Week = async (req: Request, res: Response) => {
    const { year, period, userId, sectorId } = req.body;

    if (!year || !userId || !sectorId) {
        return res.status(400).json({ message: 'Year, userId, and sectorId are required.' });
    }

    const yearAsNumber = parseInt(year as string);
    if (isNaN(yearAsNumber)) {
        return res.status(400).json({ message: 'Invalid year format.' });
    }

    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'year':
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
            break;
        case 'month':
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
            break;
        case 'week':
            startDate = startOfWeek(new Date());
            endDate = endOfWeek(new Date());
            break;
        default:
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
    }

    try {
        const statusCounts = await ServiceJob
            .createQueryBuilder("serviceJob")
            .select("serviceJob.status", "status")
            .addSelect("COUNT(*)", "count")
            .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
            .where("serviceJob.deliveryDate BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("serviceJob.serviceProviderId = :userId", { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .groupBy("serviceJob.status")
            .getRawMany();

        return res.status(200).json({
            status: "success",
            message: "Fetched service jobs by year, month, and week",
            data: { statusCounts }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error.' });
    }
};


export const totalAmountBy_Year_Month_Week = async (req: Request, res: Response) => {

    const { year, period, userId, sectorId } = req.body;

    if (!year || !userId || !sectorId) {
        return res.status(400).json({ message: 'Year or userId or sectorId is required.' });
    }

    const yearAsNumber = parseInt(year as string);
    if (isNaN(yearAsNumber)) {
        return res.status(400).json({ message: 'Invalid year format.' });
    }

    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'year':
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
            break;
        case 'month':
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
            break;
        case 'week':
            startDate = startOfWeek(new Date());
            endDate = endOfWeek(new Date());
            break;
        default:
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
    }

    try {
        const statusCounts = await ServiceJob
            .createQueryBuilder("serviceJob")
            .select("serviceJob.status")
            .addSelect(
                "SUM(CASE WHEN serviceJob.status = 'Completed' THEN serviceJob.price ELSE 0 END)",
                "totalCompletedPrice"
            )
            .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
            .where("serviceJob.deliveryDate BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("serviceJob.serviceProviderId = :userId", { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .getRawMany();

        return res.status(200).json({
            status: "success",
            message: "Fetched total amount service jobs by year, month and week",
            data: { statusCounts }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error.' });
    }
};

export const totalSalesBy_Year_Month_Week = async (req: Request, res: Response) => {

    const { year, period, sectorId, userId } = req.body;

    if (!year || !userId || !sectorId) {
        return res.status(400).json({ message: 'Year or userId or sectorId is required.' });
    }

    const yearAsNumber = parseInt(year as string);
    if (isNaN(yearAsNumber)) {
        return res.status(400).json({ message: 'Invalid year format.' });
    }

    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'year':
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
            break;
        case 'month':
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
            break;
        case 'week':
            startDate = startOfWeek(new Date());
            endDate = endOfWeek(new Date());
            break;
        default:
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
    }

    try {
        const subCategoryTotals = await ServiceJob
            .createQueryBuilder("serviceJob")
            .select("serviceJob.subCategory")
            .addSelect("SUM(serviceJob.price)", "totalPrice")
            .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
            .where("serviceJob.status = :status", { status: 'Completed' })
            .andWhere("serviceJob.deliveryDate BETWEEN :startDate AND :endDate", { startDate, endDate })
            .andWhere("serviceJob.serviceProviderId = :userId", { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .groupBy("serviceJob.subCategory")
            .getRawMany();

        return res.status(200).json({
            status: "success",
            message: "Fetched total sales amount for service jobs by subcategory",
            data: { subCategoryTotals }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error.' });
    }
};

