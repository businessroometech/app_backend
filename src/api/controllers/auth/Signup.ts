import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { UserSectorCategory } from '@/api/entity/user/UserSectorCategory';
import { AppDataSource } from '@/server';
import { BusinessDetails } from '@/api/entity/profile/business/BusinessDetails';
import NotificationController from '../notifications/Notification';
// import { QueryRunner } from 'typeorm';

export const signup = async (req: Request, res: Response): Promise<void> => {

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Ensure transaction starts before any return
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
      createdBy,
      updatedBy,
    } = req.body;

    if (!mobileNumber || !password) {
      // No need to rollback, as no transaction started
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    // Ensure you are always using the queryRunner for repository operations
    const userLoginRepository = queryRunner.manager.getRepository(UserLogin);
    const personalDetailsRepository = queryRunner.manager.getRepository(PersonalDetails);
    const businessDetailsRepository = queryRunner.manager.getRepository(BusinessDetails);

    const existingUser = await userLoginRepository.findOne({ where: { mobileNumber } });
    if (existingUser) {
      await queryRunner.rollbackTransaction();  // Rollback transaction properly
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
      primaryRole: primaryRole || 'ServiceProvider',
      userType: userType || 'Individual',
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system',
    });

    await userLoginRepository.save(newUser);  // Use the transaction-aware repository

    let details;
    if (userType === 'Individual') {
      details = personalDetailsRepository.create({
        fullName,
        mobileNumber,
        sectorId,
        userId: newUser.id,
        emailAddress: emailAddress || null,
      });

      await personalDetailsRepository.save(details);  // Use the transaction-aware repository
    } else {
      details = businessDetailsRepository.create({
        companyName: fullName,
        mobileNumber,
        sectorId,
        userId: newUser.id,
        emailAddress: emailAddress || null,
      });

      await businessDetailsRepository.save(details);  // Use the transaction-aware repository
    }

    await queryRunner.commitTransaction();  // Commit if everything is successful

    // Send SMS to welcome the user
    try {
      await NotificationController.sendNotification({
        body: {
          notificationType: 'sms',
          templateName: primaryRole === 'Customer' ? 'welcome_cus' : 'welcome_sp',
          recipientId: newUser?.id,
          recipientType: primaryRole === 'Customer' ? 'Customer' : 'ServiceProvider',
          data: {
            'Customer Name': fullName,
            'Provider Name': fullName,
            'Company Name': 'Connect',
          },
        },
      } as Request, res);
    } catch (err: any) {
      console.error('Signup successful but error sending SMS:', err.message || err);
    }

    try {
      await NotificationController.sendNotification({
        body: {
          notificationType: 'inApp',
          templateName: primaryRole === 'Customer' ? 'welcome_cus' : 'welcome_sp',
          recipientId: newUser?.id,
          recipientType: primaryRole === 'Customer' ? 'Customer' : 'ServiceProvider',
          data: {
            'Customer Name': fullName,
            'Provider Name': fullName,
            'Company Name': 'Connect',
          },
        },
      } as Request, res);
    } catch (err: any) {
      console.error('Signup successful but error sending SMS:', err.message || err);
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
    // Check if the transaction is active before rolling back
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();  // Ensure rollback happens only if transaction is active
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
