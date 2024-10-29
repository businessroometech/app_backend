import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { UserCategoryMapping } from '@/api/entity/user/UserCategoryMapping';
import { AppDataSource } from '@/server';
import { BusinessDetails } from '@/api/entity/profile/business/BusinessDetails';
import NotificationController from '../notifications/Notification';
import { PrimaryRoleMapping } from '@/api/entity/user/PrimaryRoleMapping';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const {
      mobileNumber,
      password,
      fullName,
      emailAddress,
      primaryRole = 'ServiceProvider',
      userType = 'Individual',
      sectorId,
      categoryId,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    if (!mobileNumber || !password) {
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    const userLoginRepository = queryRunner.manager.getRepository(UserLogin);
    const primaryRoleMappedRepository = queryRunner.manager.getRepository(PrimaryRoleMapping);
    const personalDetailsRepository = queryRunner.manager.getRepository(PersonalDetails);
    const businessDetailsRepository = queryRunner.manager.getRepository(BusinessDetails);
    const userCategoryMappingRepository = queryRunner.manager.getRepository(UserCategoryMapping);

    const existingUser = await userLoginRepository.findOne({ where: { mobileNumber } });
    if (existingUser) {
      await queryRunner.rollbackTransaction();
      res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered',
        data: { user: existingUser },
      });
      return;
    }

    const newUser = userLoginRepository.create({
      mobileNumber,
      password,
      userType,
      createdBy,
      updatedBy,
    });
    await userLoginRepository.save(newUser);

    const primaryRoleMapped = primaryRoleMappedRepository.create({
      userId: newUser.id,
      mobileNumber: newUser.mobileNumber,
      primaryRole,
    });
    await primaryRoleMappedRepository.save(primaryRoleMapped);

    await userCategoryMappingRepository.create({
      userId: newUser.id,
      sectorId,
      categoryId,
    }).save();

    let details;
    if (userType === 'Individual') {
      details = personalDetailsRepository.create({
        fullName,
        mobileNumber,
        sectorId,
        userId: newUser.id,
        emailAddress: emailAddress || null,
      });
      await personalDetailsRepository.save(details);
    } else {
      details = businessDetailsRepository.create({
        companyName: fullName,
        mobileNumber,
        sectorId,
        userId: newUser.id,
        emailAddress: emailAddress || null,
      });
      await businessDetailsRepository.save(details);
    }

    await queryRunner.commitTransaction();

    const notificationData = {
      notificationType: 'sms',
      templateName: primaryRole === 'Customer' ? 'welcome_cus' : 'welcome_sp',
      recipientId: newUser.id,
      recipientType: primaryRole === 'Customer' ? 'Customer' : 'ServiceProvider',
      data: { 'var1': fullName },
    };

    try {
      const smsResult = await NotificationController.sendNotification({ body: notificationData } as Request);
      console.log(smsResult.message);

      notificationData.notificationType = 'inApp';
      const inAppResult = await NotificationController.sendNotification({ body: notificationData } as Request);
      console.log(inAppResult.message);
    } catch (notificationError: any) {
      console.error('Signup successful but error sending notification:', notificationError.message || notificationError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Signup completed',
      data: {
        user: newUser,
        details,
      },
    });
  } catch (error: any) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error during signup:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        status: 'error',
        message: 'This Email is already in use.',
      });
      return;
    }
    res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.' });
  } finally {
    await queryRunner.release();
  }
};
