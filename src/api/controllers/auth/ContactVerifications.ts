import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Request, Response } from 'express';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// import { ContactVerification } from '../../entity/others/ContactVerification';
import { UserLogin } from '../../entity/user/UserLogin';
import { OtpVerification } from '@/api/entity/others/OtpVerification';

// import AWS from 'aws-sdk';

// AWS.config.update({
//   region: process.env.AWS_REGION || 'ap-south-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
//   },
// })

// const sns = new AWS.SNS({ apiVersion: "latest" });

const sns = new SNSClient({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  region: process.env.AWS_REGION || 'ap-south-1',
});

const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const sendVerificationCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, userType, useCase, mobileNumber } = req.body;

    let user: UserLogin | null = null;
    let number: string;

    if (useCase === 'Signup') {
      number = mobileNumber;
      const existingUser: UserLogin | null = await UserLogin.findOne({ where: { mobileNumber } });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Mobile number already registered',
          data: { user: existingUser },
        });
      }
    } else {
      // For other use cases, require userId and fetch the user
      if (!userId) {
        return res.status(400).json({ status: 'error', message: 'Please provide userId for this use case.' });
      }

      user = await UserLogin.findOne({ where: { id: userId } });
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

    if (useCase === 'Signup') {
      otpObj = await OtpVerification.findOne({ where: { mobileNumber, useCase } });
    } else {
      otpObj = await OtpVerification.findOne({ where: { userId, useCase } });
    }

    const currentDate = new Date();
    const cooldownPeriod = 1 * 60 * 1000;  // 1 minute cooldown
    const expirationPeriod = 5 * 60 * 1000;  // 5 minutes expiration

    if (otpObj) {
      const lastSentAt = new Date(otpObj.updatedAt);
      if (currentDate.getTime() - lastSentAt.getTime() < cooldownPeriod) {
        return res.status(429).json({ status: 'error', message: 'Please wait before requesting a new verification code.' });
      }

      otpObj.verificationCode = code;
      otpObj.isVerified = false;
      otpObj.expiresAt = new Date(currentDate.getTime() + expirationPeriod);
      await otpObj.save();
    } else {
      otpObj = await OtpVerification.create({
        userId: useCase === 'Signup' ? null : userId,
        mobileNumber,
        verificationCode: code,
        isVerified: false,
        expiresAt: new Date(currentDate.getTime() + expirationPeriod),
        userType,
        sentTo: 'Mobile',
        useCase,
      }).save();
    }

    //-------SMS sending logic---------------
    const params = {
      Message: `Your verification code is: ${code}`,
      PhoneNumber: formattedNumber,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'MySenderID',
        },
      },
    };

    try {
      const command = new PublishCommand(params);
      const data = await sns.send(command);
      console.log('aws publish :', data);
      console.log(`Verification code sent to ${formattedNumber}: ${code}`);
    } catch (error) {
      console.error('Error sending message:', error);
      return res.status(500).json({ status: 'error', message: 'Failed to send verification code.' });
    }

    return res.status(200).json({ status: 'success', message: 'Verification code sent successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};


export const verifyCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, verificationCode, useCase, mobileNumber } = req.body;

    if ((!userId && useCase !== 'Signup') || !verificationCode || !useCase || (useCase === 'Signup' && !mobileNumber)) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Please provide userId (except for Signup), mobileNumber (for Signup), verification code, and useCase.' });
    }

    let isVerify;

    if (useCase === 'Signup') {
      isVerify = await OtpVerification.findOne({ where: { mobileNumber, verificationCode, useCase } });
    } else {
      isVerify = await OtpVerification.findOne({ where: { userId, verificationCode, useCase } });
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


