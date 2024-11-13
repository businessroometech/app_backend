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

    let user = await userLoginRepository.findOne({ where: { mobileNumber } });
    if (user) {
      const primaryRoleMappings = await primaryRoleMappedRepository.find({ where: { userId: user.id } });
      const prm = primaryRoleMappings.find((ele) => ele.primaryRole === 'ServiceProvider');

      if (!prm) {
        await primaryRoleMappedRepository.create({
          primaryRole: 'ServiceProvider',
          userId: user.id,
          mobileNumber: user.mobileNumber
        }).save();
      }
      else {
        res.status(400).json({ status: "error", message: "User already present!" });
        return;
      }
    }
    else {
      user = userLoginRepository.create({
        mobileNumber,
        password,
        userType,
        createdBy,
        updatedBy,
      });

      const primaryRoleMapped = primaryRoleMappedRepository.create({
        userId: user.id,
        mobileNumber: user.mobileNumber,
        primaryRole,
      });
      await primaryRoleMappedRepository.save(primaryRoleMapped);

      // user.primaryRoleId = primaryRoleMapped.id;
      await userLoginRepository.save(user);
    }

    await userCategoryMappingRepository.create({
      userId: user.id,
      sectorId,
      categoryId,
    }).save();

    let details;
    if (userType === 'Individual') {
      details = personalDetailsRepository.create({
        fullName,
        mobileNumber,
        sectorId,
        userId: user.id,
        emailAddress: emailAddress || null,
      });
      await personalDetailsRepository.save(details);
    } else {
      details = businessDetailsRepository.create({
        companyName: fullName,
        mobileNumber,
        sectorId,
        userId: user.id,
        emailAddress: emailAddress || null,
      });
      await businessDetailsRepository.save(details);
    }

    await queryRunner.commitTransaction();

    const notificationData = {
      notificationType: 'sms',
      templateName: primaryRole === 'Customer' ? 'welcome_cus' : 'welcome_sp',
      recipientId: user.id,
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
        user: user,
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
