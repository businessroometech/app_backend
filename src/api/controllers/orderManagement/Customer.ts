import { Request, Response } from 'express';
import { Cart } from '../../entity/orderManagement/customer/Cart';
import { CartItemBooking } from '../../entity/orderManagement/customer/CartItemBooking';
import { Order } from '../../entity/orderManagement/customer/Order';
import { OrderItemBooking } from '../../entity/orderManagement/customer/OrderItemBooking';
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
import { FindOptionsWhere, In } from 'typeorm';
import { format } from 'date-fns';
import NotificationController from '../notifications/Notification';
import { TicketItem } from '@/api/entity/event/TicketItem';
import { ServiceJobRescheduled } from '@/api/entity/orderManagement/serviceProvider/serviceJob/ServiceJobReschedueled';

// ----------------------------------------------** IMP ** NEED TO ADD ACID PROPERTIES------------------------------------------

// export const getProvidedServicesByCategoryAndSubCategory = async (req: Request, res: Response) => {
//   try {
//     const { categoryId, subCategoryId } = req.body;
//     const { serviceName, minPrice, maxPrice, city, sortBy = 'asc' } = req.body;

//     const providedServiceRepository = AppDataSource.getRepository(ProvidedService);
//     const serviceJobRepository = AppDataSource.getRepository(ServiceJob);
//     const serviceRepository = AppDataSource.getRepository(Service);

//     let providedServicesQuery = providedServiceRepository
//       .createQueryBuilder('providedService')
//       .leftJoinAndSelect('providedService.category', 'category')
//       .leftJoinAndSelect('providedService.subCategory', 'subCategory')
//       .leftJoin(UserLogin, 'userLogin', 'userLogin.id = providedService.serviceProviderId')

//       .leftJoinAndMapOne(
//         'providedService.personalDetails',
//         PersonalDetails,
//         'personalDetails',
//         'personalDetails.userId = userLogin.id AND userLogin.userType = :individual',
//         { individual: 'Individual' }
//       )

//       .leftJoinAndMapOne(
//         'providedService.businessDetails',
//         BusinessDetails,
//         'businessDetails',
//         'businessDetails.userId = userLogin.id AND userLogin.userType = :business',
//         { business: 'Business' }
//       )
//       .where('providedService.categoryId = :categoryId', { categoryId })
//       .andWhere('providedService.subCategoryId = :subCategoryId', { subCategoryId });

//     if (minPrice && maxPrice) {
//       providedServicesQuery.andWhere('providedService.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice });
//     }

//     if (city) {
//       providedServicesQuery.andWhere(
//         `(userLogin.userType = :individual AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(personalDetails.currentAddress, '$.city'))) = :city) 
//          OR (userLogin.userType = :business AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(businessDetails.currentAddress, '$.city'))) = :city)`,
//         { individual: 'Individual', business: 'Business', city: city.toLowerCase() }
//       );
//     }

//     if (sortBy && (sortBy.toLowerCase() === 'asc' || sortBy.toLowerCase() === 'desc')) {
//       providedServicesQuery.orderBy('providedService.price', sortBy.toUpperCase() as 'ASC' | 'DESC');
//     }

//     const providedServices = await providedServicesQuery.getMany();

//     const overallMaxPrice = providedServices.reduce((max, service) => (service.price > max ? service.price : max), 0);

//     const allServiceIds = providedServices.flatMap((service) => service.serviceIds);

//     let services: any[] = [];
//     if (allServiceIds.length > 0) {
//       const servicesQuery = serviceRepository
//         .createQueryBuilder('service')
//         .where('service.id IN (:...ids)', { ids: allServiceIds });

//       if (serviceName) {
//         servicesQuery.andWhere('service.name LIKE :serviceName', { serviceName: `%${serviceName}%` });
//       }

//       services = await servicesQuery.getMany();
//     }

//     const servicesMap = new Map(services.map((service) => [service.id, service]));

//     const fetchClients = async (serviceProviderId: string) => {
//       const sps = await serviceJobRepository.findAndCount({ where: { serviceProviderId, status: 'Completed' } });
//       return sps[1];
//     };

//     const enrichedProvidedServices = await Promise.all(
//       providedServices.map(async (providedService) => ({
//         ...providedService,
//         serviceProviderClientsCount: await fetchClients(providedService.serviceProviderId),
//         services: providedService.serviceIds.map((id) => servicesMap.get(id)).filter(Boolean),
//       }))
//     );

//     res.status(200).json({
//       status: 'success',
//       message: 'Successfully fetched service providers',
//       data: {
//         providedServices: enrichedProvidedServices,
//         maxPrice: overallMaxPrice,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching provided services:', error);
//     res.status(500).json({ message: 'Server error. Please try again later.' });
//   }
// };

export const getProvidedServicesByCategoryAndSubCategory = async (req: Request, res: Response) => {
  try {
    const { categoryId, subCategoryId, subCategoryName } = req.body;
    const { serviceName, minPrice, maxPrice, city, sortBy = 'asc' } = req.body;

    const providedServiceRepository = AppDataSource.getRepository(ProvidedService);
    const serviceJobRepository = AppDataSource.getRepository(ServiceJob);
    const serviceRepository = AppDataSource.getRepository(Service);

    let providedServicesQuery = providedServiceRepository
      .createQueryBuilder('providedService')
      .leftJoinAndSelect('providedService.category', 'category')
      .leftJoinAndSelect('providedService.subCategory', 'subCategory')
      .leftJoin(UserLogin, 'userLogin', 'userLogin.id = providedService.serviceProviderId')

      .leftJoinAndMapOne(
        'providedService.personalDetails',
        PersonalDetails,
        'personalDetails',
        'personalDetails.userId = userLogin.id AND userLogin.userType = :individual',
        { individual: 'Individual' }
      )

      .leftJoinAndMapOne(
        'providedService.businessDetails',
        BusinessDetails,
        'businessDetails',
        'businessDetails.userId = userLogin.id AND userLogin.userType = :business',
        { business: 'Business' }
      )
      .where('providedService.categoryId = :categoryId', { categoryId });

    // Applying subcategory filter based on subCategoryName or subCategoryId
    if (subCategoryName) {
      providedServicesQuery.andWhere('LOWER(subCategory.subCategoryName) = :subCategoryName', { subCategoryName: subCategoryName.toLowerCase() });
    } else if (subCategoryId) {
      providedServicesQuery.andWhere('providedService.subCategoryId = :subCategoryId', { subCategoryId });
    }

    if (minPrice && maxPrice) {
      providedServicesQuery.andWhere('providedService.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice });
    }

    if (city) {
      providedServicesQuery.andWhere(
        `(userLogin.userType = :individual AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(personalDetails.currentAddress, '$.city'))) = :city) 
         OR (userLogin.userType = :business AND LOWER(JSON_UNQUOTE(JSON_EXTRACT(businessDetails.currentAddress, '$.city'))) = :city)`,
        { individual: 'Individual', business: 'Business', city: city.toLowerCase() }
      );
    }

    if (sortBy && (sortBy.toLowerCase() === 'asc' || sortBy.toLowerCase() === 'desc')) {
      providedServicesQuery.orderBy('providedService.price', sortBy.toUpperCase() as 'ASC' | 'DESC');
    }

    const providedServices = await providedServicesQuery.getMany();

    const overallMaxPrice = providedServices.reduce((max, service) => (service.price > max ? service.price : max), 0);

    const allServiceIds = providedServices.flatMap((service) => service.serviceIds);

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

    const servicesMap = new Map(services.map((service) => [service.id, service]));

    const fetchClients = async (serviceProviderId: string) => {
      const sps = await serviceJobRepository.findAndCount({ where: { serviceProviderId, status: 'Completed' } });
      return sps[1];
    };

    const enrichedProvidedServices = await Promise.all(
      providedServices.map(async (providedService) => ({
        ...providedService,
        serviceProviderClientsCount: await fetchClients(providedService.serviceProviderId),
        services: providedService.serviceIds.map((id) => servicesMap.get(id)).filter(Boolean),
      }))
    );

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched service providers',
      data: {
        providedServices: enrichedProvidedServices,
        maxPrice: overallMaxPrice,
      },
    });
  } catch (error) {
    console.error('Error fetching provided services:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


export const getDistinctCitiesBySubCategory = async (req: Request, res: Response) => {
  const { subCategoryId } = req.body;

  try {
    const providedServiceRepository = AppDataSource.getRepository(ProvidedService)
    const providedServices = await providedServiceRepository.find({ where: { subCategoryId } });

    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const businessDetailsRepository = AppDataSource.getRepository(BusinessDetails);

    const citySet = new Set<string>();

    for (const providedService of providedServices) {
      const userLogin = await userLoginRepository.findOne({ where: { id: providedService.serviceProviderId } });

      if (userLogin) {
        let city = '';
        if (userLogin.userType === 'Individual') {
          const personalDetails = await personalDetailsRepository.findOne({ where: { userId: userLogin.id } });
          if (personalDetails && personalDetails.currentAddress) {
            city = personalDetails.currentAddress.city.toLowerCase();
          }
        } else if (userLogin.userType === 'Business') {
          const businessDetails = await businessDetailsRepository.findOne({ where: { userId: userLogin.id } });
          if (businessDetails && businessDetails.currentAddress) {
            city = businessDetails.currentAddress.city.toLowerCase();
          }
        }

        if (city) {
          citySet.add(city);
        }
      }
    }

    const cityList = Array.from(citySet);

    return res.status(200).json({ status: "success", message: "All available cities fetched", data: { cities: cityList } });
  } catch (error) {
    console.error('Error fetching distinct cities:', error);
    return res.status(500).json({ message: 'Error fetching cities', error });
  }
};

const timeSlots = [
  '8:00 AM - 9:00 AM',
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
];

interface SlotAccumulator {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

function convertTo24HourFormat(time: string): number {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export const getAvailableTimeSlots = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Please provide a valid delivery date' });
    }

    const currentISTDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const today = currentISTDate.toISOString().split('T')[0];

    const hours = currentISTDate.getHours();
    const minutes = currentISTDate.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const currentTimeFormatted = `${formattedHour}:${formattedMinutes} ${period}`;

    console.log('Current IST Time:', currentTimeFormatted);

    const selectedDate = new Date(date);
    const selectedDateString = selectedDate.toISOString().split('T')[0];

    const bookedJobs = await ServiceJob.find({
      where: {
        deliveryDate: date as string,
        status: 'Accepted',
      },
      select: ['deliveryTime'],
    });

    const bookedTimes = bookedJobs.map((job) => job.deliveryTime);
    console.log('Booked Times:', bookedTimes);

    const availableSlots = timeSlots.filter((slot) => {
      const slotStartTime = slot.split(' - ')[0];

      if (selectedDate < new Date(today)) {
        return false;
      }

      if (selectedDateString === today) {
        if (convertTo24HourFormat(slotStartTime) <= convertTo24HourFormat(currentTimeFormatted)) {
          return false; // Exclude past slots
        }
      }

      return !bookedTimes.includes(slot);
    });

    console.log('Available Times:', availableSlots);

    const final = availableSlots.reduce<SlotAccumulator>(
      (acc, curr) => {
        const [num, period] = curr.split(' ');

        if (period === 'AM') {
          acc.morning.push(curr);
        } else if (parseInt(num) % 12 <= 4) {
          acc.afternoon.push(curr);
        } else {
          acc.evening.push(curr);
        }

        return acc;
      },
      { morning: [], afternoon: [], evening: [] }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Available time slots fetched successfully',
      data: { availableSlots: final },
    });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// -------------------------Address--------------------------------------

export const addOrUpdateAddress = async (req: Request, res: Response) => {
  try {
    const {
      addressId,
      userId,
      title,
      addressLine1,
      addressLine2 = '',
      city,
      state,
      pincode,
      createdBy,
      updatedBy,
    } = req.body;

    if (!userId || !title || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    let userAddressRepository = AppDataSource.getRepository(UserAddress);

    let userAddress;
    if (addressId) {
      // Edit existing address
      userAddress = await userAddressRepository.findOne({ where: { id: addressId, userId } });

      if (!userAddress) {
        return res.status(400).json({ message: 'Address not found' });
      }

      userAddress.title = title;
      userAddress.addressLine1 = addressLine1;
      userAddress.addressLine2 = addressLine2;
      userAddress.city = city;
      userAddress.state = state;
      userAddress.pincode = pincode;
      userAddress.updatedBy = userId;
      userAddress.updatedBy = updatedBy || 'system';
    } else {
      userAddress = userAddressRepository.create({
        userId,
        title,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        createdBy: createdBy || 'system',
      });
    }

    await userAddress.save();

    return res.status(200).json({
      status: 'success',
      message: addressId ? 'Address updated successfully' : 'Address added successfully',
      data: { address: userAddress },
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

    return res.status(200).json({
      status: 'success',
      message: 'Addresses retrieved successfully',
      data: { addresses },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { userId, addressId } = req.body;

    if (!userId || !addressId) {
      return res.status(400).json({ message: 'UserId and AddressId are required' });
    }

    const userAddressRepository = AppDataSource.getRepository(UserAddress);

    const address = await userAddressRepository.findOneBy({ userId, id: addressId });

    if (!address) {
      return res.status(400).json({ message: 'Address not found' });
    }

    await userAddressRepository.delete({ userId, id: addressId });

    return res.status(200).json({
      status: 'success',
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//-----------------------------------------------------------------------------------------

// Add to Cart

export const addToCart = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      sectorId,
      serviceProviderId,
      providedServiceId,
      workDetails,
      mrp,
      cgstPercentage,
      sgstPercentage,
      deliveryDate,
      deliveryTime,
      deliveryAddressId,
      additionalNote,
      attachments,
    } = req.body;

    if (!customerId) return res.status(400).json({ message: 'Customer ID is required' });
    if (!sectorId) return res.status(400).json({ message: 'Sector ID is required' });
    if (!serviceProviderId) return res.status(400).json({ message: 'Service Provider ID is required' });
    if (!providedServiceId) return res.status(400).json({ message: 'Provided Service ID is required' });
    if (!workDetails) return res.status(400).json({ message: 'Work details are required' });
    if (!mrp) return res.status(400).json({ message: 'MRP is required' });
    if (!deliveryDate) return res.status(400).json({ message: 'Delivery date is required' });
    if (!deliveryTime) return res.status(400).json({ message: 'Delivery time is required' });
    if (!deliveryAddressId) return res.status(400).json({ message: 'Delivery Address ID is required' });

    const cart = new Cart();
    cart.customerId = customerId;
    cart.totalAmount = 0;
    cart.totalTax = 0;
    cart.totalItems = 0;
    cart.createdBy = 'system';
    await cart.save();

    // Step 3: Create a new CartItemBooking
    const cartItemBooking = new CartItemBooking();
    cartItemBooking.cartId = cart.id;
    cartItemBooking.sectorId = sectorId;
    cartItemBooking.customerId = customerId;
    cartItemBooking.serviceProviderId = serviceProviderId;
    cartItemBooking.providedServiceId = providedServiceId;
    cartItemBooking.workDetails = workDetails;
    cartItemBooking.mrp = parseFloat(mrp);
    cartItemBooking.deliveryDate = deliveryDate;
    cartItemBooking.deliveryTime = deliveryTime;
    cartItemBooking.deliveryAddressId = deliveryAddressId;
    cartItemBooking.additionalNote = additionalNote || '';
    cartItemBooking.attachments = attachments || [];
    if (cgstPercentage) cartItemBooking.cgstPercentage = cgstPercentage;
    if (sgstPercentage) cartItemBooking.sgstPercentage = sgstPercentage;
    cartItemBooking.createdBy = 'system';
    await cartItemBooking.save();

    cart.totalItems += 1;
    cart.totalAmount = parseFloat(cart.totalAmount as any) + parseFloat(cartItemBooking.totalPrice as any);
    cart.totalTax = parseFloat(cart.totalTax as any) + parseFloat(cartItemBooking.totalTax as any);

    cart.updatedBy = 'system';
    await cart.save();

    return res.status(201).json({
      status: 'success',
      message: 'Item added to cart successfully',
      data: {
        cart,
        cartItemBooking,
      },
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ message: 'Error adding item to cart', error });
  }
};

export const fetchCartItem = async (req: Request, res: Response) => {
  try {
    const { cartItemBookingId, cartId } = req.body;

    if (!cartItemBookingId || !cartId) {
      res.status(401).json({ status: 'error', message: 'cartItemBookingId or cartId is required' });
    }

    const cartItemBookingRepository = AppDataSource.getRepository(CartItemBooking);

    const cartItem = await cartItemBookingRepository.findOne({
      where: { id: cartItemBookingId, cartId },
      relations: ['providedService', 'providedService.subCategory'],
    });

    if (!cartItem) {
      res.status(401).json({ status: 'error', message: 'No item is present in the Cart' });
    }

    res.status(200).json({ status: 'success', message: 'Successfully fetched the cart item', data: { cartItem } });
  } catch (error) {
    console.error('Error fetching item from cart :', error);
    return res.status(500).json({ message: 'Error fetching item from cart', error });
  }
};

// here notification : confirm_order_cus
export const convertCartToOrder = async (req: Request, res: Response) => {
  const { cartId, userId } = req.body;

  try {
    if (!cartId || !userId) {
      return res.status(401).json({ status: 'error', message: 'cartId or userId is required.' });
    }

    const cartRepository = AppDataSource.getRepository(Cart);
    const orderRepository = AppDataSource.getRepository(Order);
    const cartItemBookingRepository = AppDataSource.getRepository(CartItemBooking);

    const cart = await cartRepository.findOne({
      where: { id: cartId, customerId: userId },
      relations: ['cartItemBookings'],
    });

    if (!cart) {
      return res.status(401).json({ status: 'error', message: 'Cart not found' });
    }

    const cartItem = await cartItemBookingRepository.findOne({ where: { cartId, customerId: userId } });

    if (!cartItem) {
      return res.status(401).json({ status: 'error', message: 'Cart Item not found' });
    }

    const order = new Order();
    order.customerId = cart.customerId;
    order.totalAmount = cart.totalAmount;
    order.totalTax = cart.totalTax;
    order.totalItems = cart.totalItems;
    order.createdBy = 'system';
    order.updatedBy = 'system';
    await orderRepository.save(order);

    const orderItem = new OrderItemBooking();
    orderItem.orderId = order.id;
    orderItem.sectorId = cartItem.sectorId;
    orderItem.customerId = cartItem.customerId;
    orderItem.serviceProviderId = cartItem.serviceProviderId;
    orderItem.providedServiceId = cartItem.providedServiceId;
    orderItem.workDetails = cartItem.workDetails;
    orderItem.price = cartItem.price;
    orderItem.mrp = cartItem.mrp;
    orderItem.discountPercentage = cartItem.discountPercentage;
    orderItem.discountAmount = cartItem.discountAmount;
    orderItem.cgstPercentage = cartItem.cgstPercentage;
    orderItem.sgstPercentage = cartItem.sgstPercentage;
    orderItem.cgstPrice = cartItem.cgstPrice;
    orderItem.sgstPrice = cartItem.sgstPrice;
    orderItem.totalTax = cartItem.totalTax;
    orderItem.totalPrice = cartItem.totalPrice;
    orderItem.deliveryDate = cartItem.deliveryDate;
    orderItem.deliveryTime = cartItem.deliveryTime;
    orderItem.deliveryAddressId = cartItem.deliveryAddressId;
    orderItem.additionalNote = cartItem.additionalNote || '';
    orderItem.attachments = cartItem.attachments;
    orderItem.status = 'Pending';
    orderItem.createdBy = 'system';
    orderItem.updatedBy = 'system';
    await orderItem.save();

    const serviceJob = new ServiceJob();
    serviceJob.orderItemBookingId = orderItem.id;
    serviceJob.customerId = orderItem.customerId;
    serviceJob.serviceProviderId = orderItem.serviceProviderId;
    serviceJob.invoiceId = order.invoiceId;
    serviceJob.jobId = order.refOrderId;
    serviceJob.status = 'Pending';
    serviceJob.workDetails = orderItem.workDetails;
    serviceJob.additionalNote = orderItem.additionalNote || '';
    serviceJob.price = orderItem.price;
    serviceJob.mrp = orderItem.mrp;
    serviceJob.discountPercentage = orderItem.discountPercentage;
    serviceJob.discountAmount = orderItem.discountAmount;
    serviceJob.cgstPercentage = orderItem.cgstPercentage;
    serviceJob.sgstPercentage = orderItem.sgstPercentage;
    serviceJob.cgstPrice = orderItem.cgstPrice;
    serviceJob.sgstPrice = orderItem.sgstPrice;
    serviceJob.totalTax = orderItem.totalTax;
    serviceJob.totalPrice = orderItem.totalPrice;
    serviceJob.deliveryDate = orderItem.deliveryDate;
    serviceJob.deliveryTime = orderItem.deliveryTime;
    serviceJob.deliveryAddressId = orderItem.deliveryAddressId;
    serviceJob.attachments = orderItem.attachments;
    serviceJob.reasonIfRejected = '';
    serviceJob.createdBy = 'system';
    serviceJob.updatedBy = 'system';
    await serviceJob.save();

    // cart is no longer active now ( Active = false )
    cart.isActive = false;
    cart.save();

    // --------------- order confirmed --------------------------
    const notificationData = {
      notificationType: 'inApp',
      templateName: 'confirm_order_cus',
      recipientId: serviceJob?.customerId,
      recipientType: 'Customer',
      data: {
        'Order ID': serviceJob?.orderItemBookingId,
      },
    };

    try {
      const inAppResultCustomer = await NotificationController.sendNotification({ body: notificationData } as Request);
      console.log(inAppResultCustomer.message);

      // service provider in app notification
      notificationData.templateName = 'new_order_sp';
      notificationData.recipientId = serviceJob?.serviceProviderId;
      notificationData.recipientType = 'ServiceProvider';
      const inAppResultService = await NotificationController.sendNotification({ body: notificationData } as Request);
      console.log(inAppResultService.message);

      // service provider sms notification
      // notificationData.notificationType = 'sms';
      // const smsResultService = await NotificationController.sendNotification({
      //   body: notificationData,
      // } as Request);
      // console.log(smsResultService.message);
    } catch (notificationError: any) {
      console.error('Order Rejfected but error sending notification:', notificationError.message || notificationError);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cart converted to order and service jobs created successfully',
      data: {
        order,
        orderItem,
        serviceJob,
      },
    });
  } catch (error) {
    console.error('Error converting cart to order and creating service jobs:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// fetch booking item
export const fetchBookingItem = async (req: Request, res: Response) => {
  try {
    const { orderItemBookingId, orderId } = req.body;

    if (!orderItemBookingId || !orderId) {
      res.status(400).json({ status: 'error', message: 'orderItemBookingId or orderId is required' });
    }

    const orderItemBookingRepository = AppDataSource.getRepository(OrderItemBooking);
    const userLoginRepository = AppDataSource.getRepository(UserLogin);

    const orderItem = await orderItemBookingRepository.findOne({
      where: { id: orderItemBookingId, orderId },
      relations: ['order', 'providedService', 'providedService.subCategory', 'providedService.category', 'address'],
    });

    const user = await userLoginRepository.findOne({ where: { id: orderItem?.serviceProviderId }, relations: ['personalDetails', 'businessDetails'] });

    res.status(200).json({ status: 'success', message: 'Successfully fetched the booked item', data: { orderItem, details: user?.personalDetails ? user.personalDetails : user?.businessDetails } });
  } catch (error) {
    console.error('Error fetching booked item :', error);
    return res.status(500).json({ message: 'Error fetching booked item ', error });
  }
};

// fetch order history

export const fetchOrderHistory = async (req: Request, res: Response) => {
  try {
    const { customerId, type = 'scheduled', onDate } = req.body;

    if (!customerId) {
      return res.status(400).json({ status: 'error', message: 'Customer ID is required.' });
    }

    const orderItemBookingRepository = AppDataSource.getRepository(OrderItemBooking);

    const queryBuilder = orderItemBookingRepository
      .createQueryBuilder('orderItemBooking')
      .leftJoinAndSelect('orderItemBooking.address', 'address')
      .leftJoinAndSelect('orderItemBooking.order', 'order')
      .leftJoinAndSelect('orderItemBooking.user', 'user')
      .leftJoinAndSelect('user.personalDetails', 'personalDetails')
      .leftJoinAndSelect('user.businessDetails', 'businessDetails')
      .leftJoinAndSelect('orderItemBooking.providedService', 'providedService')
      .leftJoinAndSelect('providedService.subCategory', 'subCategory')
      .where('orderItemBooking.customerId = :customerId', { customerId });

    if (onDate) {
      const parsedDate = new Date(onDate as string);
      const formattedDate = format(parsedDate, 'yyyy-MM-dd');
      queryBuilder.andWhere('orderItemBooking.deliveryDate = :deliveryDate', { deliveryDate: formattedDate });
    }

    if (type === 'scheduled') {
      queryBuilder.andWhere('orderItemBooking.status IN (:...statuses)', { statuses: ['Pending', 'Assigned'] });
    } else {
      queryBuilder.andWhere('orderItemBooking.status IN (:...statuses)', {
        statuses: ['Rejected', 'Completed', 'Cancelled', 'Rescheduled'],
      });
    }

    const [orderItems, count] = await queryBuilder.getManyAndCount();

    res.status(200).json({
      status: 'success',
      message: 'Orders fetched successfully',
      data: {
        orderItems,
        count,
      },
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// Cancel OrderItemBooking
export const cancelOrderItemBooking = async (req: Request, res: Response) => {
  const { orderItemBookingId, reason, updatedBy } = req.body;

  const orderItemBookingRepository = AppDataSource.getRepository(OrderItemBooking);
  const serviceJobRepository = AppDataSource.getRepository(ServiceJob);

  try {
    // Find the order item booking by its ID
    const orderItemBooking = await orderItemBookingRepository.findOne({
      where: { id: orderItemBookingId },
      relations: ['serviceJobs'], // Load related service jobs, if any
    });

    if (!orderItemBooking) {
      return res.status(404).json({ message: 'Order item booking not found' });
    }

    // Check if the order has already been cancelled or completed
    if (orderItemBooking.status === 'Cancelled' || orderItemBooking.status === 'Completed') {
      return res.status(400).json({
        message: `Order is already ${orderItemBooking.status} and cannot be cancelled`,
      });
    }

    // Update the status to "Cancelled" and record the reason and cancellation details
    orderItemBooking.status = 'Cancelled';
    orderItemBooking.reasonIfCancelled = reason;
    orderItemBooking.updatedBy = updatedBy || 'system';

    // Cancel the associated service job if exists
    let serviceJob;
    if (orderItemBooking.serviceJobs) {
      serviceJob = await serviceJobRepository.findOne({
        where: { orderItemBookingId: orderItemBooking.id },
      });

      if (serviceJob) {
        serviceJob.status = 'Cancelled';
        serviceJob.reasonIfCancelledByCustomer = reason;
        serviceJob.updatedBy = updatedBy || 'system';
        await serviceJob.save();
      }
    }

    // Save the changes to the order item booking
    await orderItemBooking.save();

    //
    return res.status(200).json({
      status: 'success',
      message: 'Order item booking successfully cancelled',
      data: { orderItemBooking, serviceJob },
    });
  } catch (error) {
    console.error('Error cancelling order item booking:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Reschedule OrderItemBooking
// Reschedule notification here : rescheduled_order_cus
export const rescheduleOrder = async (req: Request, res: Response) => {
  const {
    orderId,
    newDeliveryDate,
    newDeliveryTime,
    reason = 'No reason available !',
    createdBy,
    updatedBy,
  } = req.body;

  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemBookingRepository = AppDataSource.getRepository(OrderItemBooking);
    const reschedueledBookingRepository = AppDataSource.getRepository(RescheduledBooking);
    const serviceJobReschedueledRepository = AppDataSource.getRepository(ServiceJobRescheduled);

    const order = await orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      res.status(400).json({ status: 'error', message: 'No order present with this id' });
      return;
    }

    const orderItemBooking = await orderItemBookingRepository.findOne({ where: { orderId } });
    if (!orderItemBooking) {
      res.status(400).json({ status: 'error', message: 'No orderItemBooking present with this id' });
      return;
    }

    orderItemBooking.status = 'Pending';
    orderItemBooking.deliveryDate = newDeliveryDate;
    orderItemBooking.deliveryTime = newDeliveryTime;
    orderItemBooking.updatedBy = updatedBy || 'system';
    await orderItemBooking.save();

    await reschedueledBookingRepository.create({
      orderId: order.id,
      orderItemId: orderItemBooking.id,
      customerId: orderItemBooking.customerId,
      serviceProviderId: orderItemBooking.serviceProviderId,
      reason,
    }).save();

    // Update the service job associated with the old order item booking
    const serviceJob = await ServiceJob.findOne({ where: { orderItemBookingId: orderItemBooking.id } });

    if (serviceJob) {
      serviceJob.status = 'Pending';
      serviceJob.updatedBy = updatedBy || 'system';
      await serviceJob.save();


      await serviceJobReschedueledRepository.create({
        orderId: order.id,
        serviceJobId: serviceJob.id,
        customerId: serviceJob.customerId,
        serviceProviderId: serviceJob.serviceProviderId,
        reason,
      }).save();

      // --------------------------- reschedule of order ---------------------------
      const notificationData = {
        notificationType: 'inApp',
        templateName: 'rescheduled_order_sp',
        recipientId: serviceJob?.serviceProviderId,
        recipientType: 'ServiceProvider',
        data: {
          'Order ID': serviceJob?.orderItemBookingId,
        },
      };

      try {
        const inAppResultService = await NotificationController.sendNotification({ body: notificationData } as Request);
        // customer
        notificationData.templateName = 'rescheduled_order_cus';
        notificationData.recipientType = 'Customer';
        notificationData.recipientId = serviceJob?.customerId;
        const inAppResultCustomer = await NotificationController.sendNotification({ body: notificationData } as Request);

        console.log("-- reschedule in service provider ----", inAppResultService.message);
        console.log("-- reschedule in customer ----", inAppResultCustomer.message);
      } catch (notificationError: any) {
        console.error('Order Rejfected but error sending notification:', notificationError.message || notificationError);
      }
    }


    res.status(200).json({
      status: 'success',
      message: 'Order rescheduled successfully',
      data: { order, orderItemBooking },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 'error', message: 'Error rescheduling order' });
  }
};

// service reminder notification is missing : service_reminder_cus
// provider reassigned notification : provider_reassigned_cus
