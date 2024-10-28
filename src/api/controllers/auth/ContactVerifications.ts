import { Request, Response } from 'express';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// import { ContactVerification } from '../../entity/others/ContactVerification';
import { UserLogin } from '../../entity/user/UserLogin';
import { OtpVerification } from '@/api/entity/others/OtpVerification';
import { AppDataSource } from '@/server';
import NotificationController from '../notifications/Notification';
import { PrimaryRoleMapping } from '@/api/entity/user/PrimaryRoleMapping';

const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const sendVerificationCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, userType, useCase, mobileNumber } = req.body;

    let user: UserLogin | null = null;
    let number: string;

    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const otpVerificationRepository = AppDataSource.getRepository(OtpVerification);

    if (useCase === 'Signup') {
      if (!mobileNumber) {
        return res.status(400).json({ status: 'error', message: 'Please provide mobile number for this use case.' });
      }

      number = mobileNumber;
      const existingUser: UserLogin | null = await userLoginRepository.findOne({ where: { mobileNumber } });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Mobile number already registered',
          data: { user: existingUser },
        });
      }
    } else if (useCase === 'Forgot Password') {
      if (!mobileNumber) {
        return res.status(400).json({ status: 'error', message: 'Please provide mobile number for this use case.' });
      }

      number = mobileNumber;
      const existingUser: UserLogin | null = await userLoginRepository.findOne({ where: { mobileNumber } });
      if (!existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'This mobile number is not registered',
        });
      }
    } else {
      // For other use cases, require userId and fetch the user
      if (!userId) {
        return res.status(400).json({ status: 'error', message: 'Please provide userId for this use case.' });
      }

      user = await userLoginRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found.' });
      }

      number = user.mobileNumber;
      if (!number) {
        return res.status(400).json({ status: 'error', message: 'User does not have a mobile number registered.' });
      }
    }

    const phoneNumber = parsePhoneNumberFromString(number, 'IN');
    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(400).json({ status: 'error', message: 'Invalid phone number format.' });
    }
    const formattedNumber = phoneNumber.format('E.164');
    console.log('formatted-number :', formattedNumber);

    const code = generateVerificationCode();
    console.log('generated code: ', code);

    let otpObj;

    if (useCase === 'Signup' || useCase === 'Forgot password') {
      otpObj = await otpVerificationRepository.findOne({ where: { mobileNumber, useCase } });
    } else {
      otpObj = await otpVerificationRepository.findOne({ where: { userId, useCase } });
    }

    const currentDate = new Date();
    const cooldownPeriod = 1 * 60 * 1000; // 1 minute cooldown
    const expirationPeriod = 5 * 60 * 1000; // 5 minutes expiration

    if (otpObj) {
      const lastSentAt = new Date(otpObj.updatedAt);
      if (currentDate.getTime() - lastSentAt.getTime() < cooldownPeriod) {
        return res
          .status(429)
          .json({ status: 'error', message: 'Please wait before requesting a new verification code.' });
      }

      otpObj.verificationCode = code;
      otpObj.isVerified = false;
      otpObj.expiresAt = new Date(currentDate.getTime() + expirationPeriod);
      await otpObj.save();
    } else {
      otpObj = await otpVerificationRepository
        .create({
          userId: useCase === 'Signup' || useCase === 'Forgot Password' ? null : userId,
          mobileNumber,
          verificationCode: code,
          isVerified: false,
          expiresAt: new Date(currentDate.getTime() + expirationPeriod),
          userType,
          sentTo: 'Mobile',
          useCase,
        })
        .save();
    }

    if (useCase === 'Signup') {
      const notificationData = {
        notificationType: 'sms',
        templateName: 'login_otp',
        recipientNumber: mobileNumber,
        recipientType: 'Service Provider',
        data: {
          'var1': code,
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
    }

    return res.status(200).json({
      status: 'success',
      message: 'Verification code sent successfully.',
      data: {
        code,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

export const verifyCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, verificationCode, useCase, mobileNumber } = req.body;

    if (
      (!userId && useCase !== 'Signup' && useCase !== 'Forgot Password') ||
      !verificationCode ||
      !useCase ||
      ((useCase === 'Signup' || useCase === 'Forgot Password') && !mobileNumber)
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Please provide userId (for start-work and finish-work), mobileNumber (for Signup and forgot-password), verification code, and useCase.',
      });
    }

    const otpVerificationRepository = AppDataSource.getRepository(OtpVerification);

    let isVerify;

    if (useCase !== 'Signup' || useCase === 'Forgot Password') {
      isVerify = await otpVerificationRepository.findOne({ where: { mobileNumber, verificationCode, useCase } });
    } else {
      isVerify = await otpVerificationRepository.findOne({ where: { userId, verificationCode, useCase } });
    }

    if (!isVerify) {
      return res.status(400).json({ status: 'error', message: 'Invalid verification code' });
    }

    const expiryDate = new Date(isVerify.expiresAt);

    if (new Date() > expiryDate) {
      return res.status(400).json({ status: 'error', message: 'Verification code is expired.' });
    }

    isVerify.isVerified = true;
    await isVerify.save();

    return res.status(200).json({ status: 'success', message: 'Mobile number verified successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

// ---------------------FOR MOBILE APP-------------------------------

export const sendVerificationCode_mobile_app = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, createdBy, updatedBy } = req.body;

    if (!mobileNumber) {
      res.status(400).json({ status: 'error', message: 'Please provide Mobile number' });
      return;
    }

    const userLoginRepository = AppDataSource.getRepository(UserLogin);
    const primaryRoleMappedRepository = AppDataSource.getRepository(PrimaryRoleMapping);
    const otpVerificationRepository = AppDataSource.getRepository(OtpVerification);

    // check for registration
    let user = await userLoginRepository.findOne({ where: { mobileNumber } });

    if (!user) {
      user = await userLoginRepository
        .create({
          mobileNumber,
          password: '',
          userType: 'Individual',
          createdBy: createdBy || 'system',
          updatedBy: updatedBy || 'system',
        }).save();

      await primaryRoleMappedRepository.create({
        primaryRole: 'Customer',
        userId: user.id
      }).save();

      await user.save();
      
    } else {

      const primaryRoleMappings = await primaryRoleMappedRepository.find({ where: { userId: user.id } });
      const prm = primaryRoleMappings.find((ele) => ele.primaryRole === 'Customer');

      if (!prm) {
        await primaryRoleMappedRepository.create({
          primaryRole: 'Customer',
          userId: user.id
        }).save();
      }
    }

    const phoneNumber = parsePhoneNumberFromString(mobileNumber, 'IN');
    if (!phoneNumber || !phoneNumber.isValid()) {
      res.status(400).json({ status: 'error', message: 'Invalid phone number format.' });
      return;
    }
    const formattedNumber = phoneNumber.format('E.164');
    console.log('formatted-number :', formattedNumber);

    const code = generateVerificationCode();
    console.log('generated code: ', code);

    let otpObj = await otpVerificationRepository.findOne({ where: { mobileNumber, useCase: 'Signup' } });

    const currentDate = new Date();
    const cooldownPeriod = 1 * 60 * 1000; // 1 minute cooldown
    const expirationPeriod = 5 * 60 * 1000; // 5 minutes expiration

    if (otpObj) {
      const lastSentAt = new Date(otpObj.updatedAt);
      if (currentDate.getTime() - lastSentAt.getTime() < cooldownPeriod) {
        res.status(429).json({ status: 'error', message: 'Please wait before requesting a new verification code.' });
        return;
      }

      otpObj.verificationCode = code;
      otpObj.isVerified = false;
      otpObj.expiresAt = new Date(currentDate.getTime() + expirationPeriod);

      await otpObj.save();
    } else {
      otpObj = await otpVerificationRepository
        .create({
          mobileNumber,
          verificationCode: code,
          isVerified: false,
          expiresAt: new Date(currentDate.getTime() + expirationPeriod),
          userType: 'Customer',
          sentTo: 'Mobile',
          useCase: 'Signup',
        })
        .save();
    }


    // Send notifications (SMS and in-app) to welcome the user
    const notificationData = {
      notificationType: 'sms',
      templateName: 'login_otp',
      recipientNumber: mobileNumber,
      recipientType: 'Customer',
      data: {
        'var1': code,
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

    res.status(200).json({ status: 'success', message: 'Verification code sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Server error.' });
    return;
  }
};
