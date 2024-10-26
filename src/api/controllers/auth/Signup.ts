import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { UserSectorCategory } from '@/api/entity/user/UserSectorCategory';
import { AppDataSource } from '@/server';
import { BusinessDetails } from '@/api/entity/profile/business/BusinessDetails';
import NotificationController from '../notifications/Notification';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Start the transaction
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

    // Validate required fields
    if (!mobileNumber || !password) {
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    // Ensure you're using queryRunner for repository operations
    const userLoginRepository = queryRunner.manager.getRepository(UserLogin);
    const personalDetailsRepository = queryRunner.manager.getRepository(PersonalDetails);
    const businessDetailsRepository = queryRunner.manager.getRepository(BusinessDetails);

    // Check for existing user with the same mobile number
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

    // Create a new user entry
    const newUser = userLoginRepository.create({
      mobileNumber,
      password,
      primaryRole,
      userType,
      createdBy,
      updatedBy,
    });

    await userLoginRepository.save(newUser);

    let details;
    // Create personal or business details based on userType
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

    // Commit the transaction if everything is successful
    await queryRunner.commitTransaction();

    // Send notifications (SMS and in-app) to welcome the user
    const notificationData = {
      notificationType: 'sms',
      templateName: primaryRole === 'Customer' ? 'welcome_cus' : 'welcome_sp',
      recipientId: newUser.id,
      recipientType: primaryRole === 'Customer' ? 'Customer' : 'ServiceProvider',
      data: {
        'var1': fullName,
      },
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
    // Rollback transaction if an error occurs
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
    // Release the query runner
    await queryRunner.release();
  }
};
