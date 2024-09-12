import { Request, Response } from 'express';
import { ServiceJob } from '@/api/entity/orderManagement/serviceProvider/serviceJob/ServiceJob';
import { Between, In } from 'typeorm';
import { format, isValid, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subYears, subWeeks } from 'date-fns';
// import { Service } from '@/api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { OrderItemBooking } from '@/api/entity/orderManagement/customer/OrderItemBooking';
import { ProvidedService } from '@/api/entity/orderManagement/serviceProvider/service/ProvidedService';
import { Service } from '@/api/entity/sector/Service';
import { SubCategory } from '@/api/entity/sector/SubCategory';

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

// export const getServiceJobsBy_Year_Month_Week = async (req: Request, res: Response) => {
//     const { year, period, userId, sectorId } = req.body;

//     if (!year || !userId || !sectorId) {
//         return res.status(400).json({ message: 'Year, userId, and sectorId are required.' });
//     }

//     const yearAsNumber = parseInt(year as string);
//     if (isNaN(yearAsNumber)) {
//         return res.status(400).json({ message: 'Invalid year format.' });
//     }

//     let startDate: Date;
//     let endDate: Date;

//     switch (period) {
//         case 'year':
//             startDate = startOfYear(new Date(yearAsNumber, 0, 1));
//             endDate = endOfYear(new Date(yearAsNumber, 11, 31));
//             break;
//         case 'month':
//             startDate = startOfMonth(new Date());
//             endDate = endOfMonth(new Date());
//             break;
//         case 'week':
//             startDate = startOfWeek(new Date());
//             endDate = endOfWeek(new Date());
//             break;
//         default:
//             startDate = startOfYear(new Date(yearAsNumber, 0, 1));
//             endDate = endOfYear(new Date(yearAsNumber, 11, 31));
//     }

//     try {
//         const predefinedStatuses = ['Pending', 'Completed', 'Rejected', 'Accepted']; // List all possible statuses

//         const statusCounts = await ServiceJob
//             .createQueryBuilder("serviceJob")
//             .select("serviceJob.status", "status")
//             .addSelect("COUNT(*)", "count")
//             .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
//             .where("serviceJob.deliveryDate BETWEEN :startDate AND :endDate", { startDate, endDate })
//             .andWhere("serviceJob.serviceProviderId = :userId", { userId })
//             .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
//             .groupBy("serviceJob.status")
//             .getRawMany();

//         // Convert query results to a map for easier processing
//         const statusCountMap = new Map<string, number>();
//         statusCounts.forEach(({ status, count }) => {
//             statusCountMap.set(status, parseInt(count));
//         });

//         // Ensure all predefined statuses are included in the result
//         const result = predefinedStatuses.map(status => ({
//             status,
//             count: statusCountMap.get(status) || 0
//         }));


//         return res.status(200).json({
//             status: "success",
//             message: "Fetched service jobs by year, month, and week",
//             data: { statusCounts: result }
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Server error.' });
//     }
// };

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
    let prevStartDate: Date;
    let prevEndDate: Date;

    // Determine the start and end dates based on the selected period (year, month, week)
    switch (period) {
        case 'year':
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
            prevStartDate = startOfYear(subYears(startDate, 1));
            prevEndDate = endOfYear(subYears(endDate, 1));
            break;
        case 'month':
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
            prevStartDate = startOfMonth(subMonths(startDate, 1));
            prevEndDate = endOfMonth(subMonths(endDate, 1));
            break;
        case 'week':
            startDate = startOfWeek(new Date());
            endDate = endOfWeek(new Date());
            prevStartDate = startOfWeek(subWeeks(startDate, 1));
            prevEndDate = endOfWeek(subWeeks(endDate, 1));
            break;
        default:
            startDate = startOfYear(new Date(yearAsNumber, 0, 1));
            endDate = endOfYear(new Date(yearAsNumber, 11, 31));
            prevStartDate = startOfYear(subYears(startDate, 1));
            prevEndDate = endOfYear(subYears(endDate, 1));
    }

    console.log(startDate, endDate);
    console.log(prevStartDate, prevEndDate);

    try {
        // Define the list of possible statuses
        const predefinedStatuses = ['Pending', 'Completed', 'Rejected', 'Accepted'];

        // Helper function to get service job counts for a given date range
        const getServiceJobCounts = async (startDate: Date, endDate: Date) => {
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

            const statusCountMap = new Map<string, number>();
            statusCounts.forEach(({ status, count }) => {
                statusCountMap.set(status, parseInt(count));
            });

            return predefinedStatuses.map(status => ({
                status,
                count: statusCountMap.get(status) || 0
            }));
        };

        // Fetch counts for the current period
        const currentPeriodCounts = await getServiceJobCounts(startDate, endDate);

        // Fetch counts for the previous period
        const prevPeriodCounts = await getServiceJobCounts(prevStartDate, prevEndDate);

        return res.status(200).json({
            status: "success",
            message: "Fetched service jobs by year, month, and week",
            data: {
                currentPeriod: currentPeriodCounts,
                previousPeriod: prevPeriodCounts
            }
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
        const result = await ServiceJob
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
            data: { totalAmount: result, commissionCharges: 0 }
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

export const getAvgPricePerMonthForCurrentYear = async (req: Request, res: Response) => {
    try {
        const { year, sectorId, userId } = req.body;

        if (!year || !userId || !sectorId) {
            return res.status(400).json({ message: 'Year, UserId, and SectorId are required.' });
        }

        const query = ServiceJob
            .createQueryBuilder('serviceJob')
            .select('DATE_FORMAT(serviceJob.deliveryDate, \'%m\')', 'month')
            .addSelect('AVG(serviceJob.price)', 'averagePrice')
            .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
            .where('serviceJob.status = :status', { status: 'Completed' })
            .andWhere('DATE_FORMAT(serviceJob.deliveryDate, \'%Y\') = :year', { year })
            .andWhere('serviceJob.serviceProviderId = :userId', { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .groupBy('DATE_FORMAT(serviceJob.deliveryDate, \'%m\')')
        // .orderBy('month', 'ASC');

        const result = await query.getRawMany();
        console.log(result);

        // Fill missing months with 0 average price
        const monthlyAverages = Array(12).fill(0).map((_, index) => {
            const found = result.find(row => parseInt(row.month) === index + 1);
            return {
                month: index + 1,
                averagePrice: found ? parseFloat(found.averagePrice) : 0
            };
        });

        return res.json({ status: "success", message: "Fetched avg. sales for all months for current year", data: { monthlyAverages } });
    } catch (error) {
        console.log("Error fetching avg order prices:", error);
        return res.status(500).json({ status: "error", message: 'Internal Server Error' });
    }
};


export const compareAvgPriceWithPreviousMonth = async (req: Request, res: Response) => {
    const { year, month, userId, sectorId } = req.body;

    if (!year || !month || !userId || !sectorId) {
        return res.status(400).json({ message: 'Year or month or userId or sectorId are required.' });
    }

    const yearAsNumber = parseInt(year as string);
    const monthAsNumber = parseInt(month as string);

    if (isNaN(yearAsNumber) || isNaN(monthAsNumber) || monthAsNumber < 1 || monthAsNumber > 12) {
        return res.status(400).json({ message: 'Invalid year or month format.' });
    }

    // Determine the start and end dates for the current month
    const startDateCurrentMonth = startOfMonth(new Date(yearAsNumber, monthAsNumber - 1, 1));
    const endDateCurrentMonth = endOfMonth(startDateCurrentMonth);

    // Determine the start and end dates for the previous month
    const startDatePreviousMonth = startOfMonth(subMonths(startDateCurrentMonth, 1));
    const endDatePreviousMonth = endOfMonth(startDatePreviousMonth);

    try {
        // Calculate average price for the given month
        const avgPriceCurrentMonthResult = await ServiceJob
            .createQueryBuilder('serviceJob')
            .select('AVG(serviceJob.price)', 'averagePrice')
            .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
            .where('serviceJob.status = :status', { status: 'Completed' })
            .andWhere('serviceJob.deliveryDate BETWEEN :startDate AND :endDate', { startDate: startDateCurrentMonth.toISOString().split('T')[0], endDate: endDateCurrentMonth.toISOString().split('T')[0] })
            .andWhere('serviceJob.serviceProviderId = :userId', { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .getRawOne();

        // Calculate average price for the previous month
        const avgPricePreviousMonthResult = await ServiceJob
            .createQueryBuilder('serviceJob')
            .select('AVG(serviceJob.price)', 'averagePrice')
            .innerJoin("serviceJob.orderItemBooking", "orderItemBooking")
            .where('serviceJob.status = :status', { status: 'Completed' })
            .andWhere('serviceJob.deliveryDate BETWEEN :startDate AND :endDate', { startDate: startDatePreviousMonth.toISOString().split('T')[0], endDate: endDatePreviousMonth.toISOString().split('T')[0] })
            .andWhere('serviceJob.serviceProviderId = :userId', { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .getRawOne();

        // Extract average prices or default to 0 if null
        const avgPriceCurrentMonth = avgPriceCurrentMonthResult?.averagePrice ? parseFloat(avgPriceCurrentMonthResult.averagePrice) : 0;
        const avgPricePreviousMonth = avgPricePreviousMonthResult?.averagePrice ? parseFloat(avgPricePreviousMonthResult.averagePrice) : 0;

        return res.status(200).json({
            status: "success",
            message: "Comparison of average prices between current and previous month",
            data: {
                currentMonthAveragePrice: avgPriceCurrentMonth,
                previousMonthAveragePrice: avgPricePreviousMonth,
                difference: avgPriceCurrentMonth - avgPricePreviousMonth
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error.' });
    }
};

export const totalSalesSubCategoryWise = async (req: Request, res: Response) => {
    const { year, period, sectorId, userId } = req.body;

    if (!year || !period || !userId || !sectorId) {
        return res.status(400).json({ message: 'Year, userId, or sectorId is required.' });
    }

    const yearAsNumber = parseInt(year as string);
    if (isNaN(yearAsNumber)) {
        return res.status(400).json({ message: 'Invalid year format.' });
    }

    let currentPeriodStartDate: Date;
    let currentPeriodEndDate: Date;
    let previousPeriodStartDate: Date;
    let previousPeriodEndDate: Date;

    // Calculate the start and end dates for both current and previous periods
    switch (period) {
        case 'year':
            currentPeriodStartDate = startOfYear(new Date(yearAsNumber, 0, 1));
            currentPeriodEndDate = endOfYear(new Date(yearAsNumber, 11, 31));
            previousPeriodStartDate = startOfYear(subYears(new Date(yearAsNumber, 0, 1), 1));
            previousPeriodEndDate = endOfYear(subYears(new Date(yearAsNumber, 11, 31), 1));
            break;
        case 'month':
            currentPeriodStartDate = startOfMonth(new Date());
            currentPeriodEndDate = endOfMonth(new Date());
            previousPeriodStartDate = startOfMonth(subMonths(new Date(), 1));
            previousPeriodEndDate = endOfMonth(subMonths(new Date(), 1));
            break;
        case 'week':
            currentPeriodStartDate = startOfWeek(new Date());
            currentPeriodEndDate = endOfWeek(new Date());
            previousPeriodStartDate = startOfWeek(subWeeks(new Date(), 1));
            previousPeriodEndDate = endOfWeek(subWeeks(new Date(), 1));
            break;
        default:
            return res.status(400).json({ message: 'Invalid period type. Should be "year", "month", or "week".' });
    }

    try {
        // Fetch sales for the current period
        const currentPeriodSales = await SubCategory
            .createQueryBuilder('subCategory')
            .leftJoin('subCategory.providedServices', 'providedService')
            .leftJoin('providedService.orderItemBookings', 'orderItemBooking')
            .leftJoin('orderItemBooking.serviceJobs', 'serviceJob')
            .select('subCategory.subCategoryName', 'subCategory')
            .addSelect('SUM(serviceJob.price)', 'totalSales')
            .where('serviceJob.status = :status', { status: 'Completed' })
            .andWhere("serviceJob.deliveryDate BETWEEN :startDate AND :endDate", { startDate: currentPeriodStartDate, endDate: currentPeriodEndDate })
            .andWhere("serviceJob.serviceProviderId = :userId", { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .groupBy('subCategory.subCategoryName')
            .getRawMany();

        // Fetch sales for the previous period
        const previousPeriodSales = await SubCategory
            .createQueryBuilder('subCategory')
            .leftJoin('subCategory.providedServices', 'providedService')
            .leftJoin('providedService.orderItemBookings', 'orderItemBooking')
            .leftJoin('orderItemBooking.serviceJobs', 'serviceJob')
            .select('subCategory.subCategoryName', 'subCategory')
            .addSelect('SUM(serviceJob.price)', 'totalSales')
            .where('serviceJob.status = :status', { status: 'Completed' })
            .andWhere("serviceJob.deliveryDate BETWEEN :startDate AND :endDate", { startDate: previousPeriodStartDate, endDate: previousPeriodEndDate })
            .andWhere("serviceJob.serviceProviderId = :userId", { userId })
            .andWhere("orderItemBooking.sectorId = :sectorId", { sectorId })
            .groupBy('subCategory.subCategoryName')
            .getRawMany();

        // Create a map to store subcategory sales for both periods
        const salesMap: { [key: string]: { currentPeriodSales: number | null, previousPeriodSales: number | null } } = {};

        // Populate the salesMap with current period sales
        currentPeriodSales.forEach((item) => {
            salesMap[item.subCategory] = {
                currentPeriodSales: parseFloat(item.totalSales) || 0,
                previousPeriodSales: 0
            };
        });

        // Populate the salesMap with previous period sales, ensuring each subcategory is accounted for
        previousPeriodSales.forEach((item) => {
            if (salesMap[item.subCategory]) {
                salesMap[item.subCategory].previousPeriodSales = parseFloat(item.totalSales) || 0;
            } else {
                salesMap[item.subCategory] = {
                    currentPeriodSales: 0,
                    previousPeriodSales: parseFloat(item.totalSales) || 0
                };
            }
        });

        // Convert the salesMap to an array for response
        const result = Object.keys(salesMap).map(subCategory => ({
            subCategory,
            currentPeriodSales: salesMap[subCategory].currentPeriodSales,
            previousPeriodSales: salesMap[subCategory].previousPeriodSales
        }));

        return res.status(200).json({ status: "success", message: "Successfully fetched total sales sub category wise", data: { result } });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: 'Something went wrong' });
    }
};