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
    const { userId, userType, useCase } = req.body;

    const user = await UserLogin.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const mobileNumber = user.mobileNumber;
    if (!mobileNumber) {
      return res.status(400).json({ status: 'error', message: 'Please provide a mobile number.' });
    }

    const phoneNumber = parsePhoneNumberFromString(mobileNumber, 'IN');
    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(400).json({ status: 'error', message: 'Invalid phone number format.' });
    }
    const formatedNumber = phoneNumber.format('E.164');
    console.log('formated-number :', formatedNumber);

    const existingUser: UserLogin | null = await UserLogin.findOne({ where: { mobileNumber } });
    if (existingUser && useCase === 'Signup') {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered',
        data: { user: existingUser },
      });
    }

    const code = generateVerificationCode();
    console.log('generated code: ', code);

    let otpObj = await OtpVerification.findOne({ where: { userId, useCase } });

    const currentDate = new Date();
    const cooldownPeriod = 1 * 60 * 1000;  // 1 minute cooldown
    const expirationPeriod = 5 * 60 * 1000;  // 5 minutes expiration

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
      otpObj = await OtpVerification.create({
        userId,
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
      PhoneNumber: formatedNumber,
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
      console.log(`Verification code sent to ${formatedNumber}: ${code}`);
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

// export const sendVerificationCode = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     const { userId, userType, useCase} = req.body;

//     const user = await UserLogin.findOne({ where: { id: userId}})

//     if(!user)
//     {

//     }

//     const mobileNumber = user!.mobileNumber;

//     if (!mobileNumber) {
//       return res.status(400).json({ status: 'error', message: 'Please provide a mobile number.' });
//     }

//     const phoneNumber = parsePhoneNumberFromString(mobileNumber, 'IN');

//     if (!phoneNumber || !phoneNumber.isValid()) {
//       return res.status(400).json({ status: 'error', message: 'Invalid phone number format.' });
//     }
//     const formatedNumber = phoneNumber.format('E.164');
//     console.log('formated-number :', formatedNumber);
//     const existingUser: UserLogin | null = await UserLogin.findOne({ where: { mobileNumber } });

//     if (existingUser) {
//       return res.status(400).json({
//         status: 'error',
//         message: 'Mobile number already registered',
//         data: { user: existingUser },
//       });
//     }

//     const code = generateVerificationCode();
//     console.log('generated code: ', code);

//     let verifyObj = await ContactVerification.findOne({ where: { mobileNumber } });

//     const currentDate = new Date();
//     const cooldownPeriod = 1 * 60 * 1000;
//     const expirationPeriod = 5 * 60 * 1000;

//     if (verifyObj) {
//       const lastSentAt = new Date(verifyObj.updatedAt);
//       if (currentDate.getTime() - lastSentAt.getTime() < cooldownPeriod) {
//         return res
//           .status(429)
//           .json({ status: 'error', message: 'Please wait before requesting a new verification code.' });
//       }

//       verifyObj.verificationCode = code;
//       verifyObj.isVerified = false;
//       verifyObj.expiresAt = new Date(currentDate.getTime() + expirationPeriod);
//       await verifyObj.save();
//     } else {
//       verifyObj = await ContactVerification.create({
//         mobileNumber,
//         verificationCode: code,
//         expiresAt: new Date(currentDate.getTime() + expirationPeriod),
//       }).save();
//     }

//     //-------SMS sending logic---------------

//     const params = {
//       Message: `Your verification code is: ${code}`,
//       PhoneNumber: formatedNumber,
//       MessageAttributes: {
//         'AWS.SNS.SMS.SenderID': {
//           DataType: 'String',
//           StringValue: 'MySenderID',
//         },
//       },
//     };

//     try {
//       const command = new PublishCommand(params);
//       const data = await sns.send(command);
//       console.log('aws publish :', data);
//       console.log(`Verification code sent to ${formatedNumber}: ${code}`);
//     } catch (error) {
//       console.error('Error sending message:', error);
//       return res.status(500).json({ status: 'error', message: 'Failed to send verification code.' });
//     }

//     return res.status(200).json({ status: 'success', message: 'Verification code sent successfully.' });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ status: 'error', message: 'Server error.' });
//   }
// };

export const verifyCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, verificationCode, useCase } = req.body;

    if (!userId || !verificationCode || !useCase) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Please provide userId, verification code, and useCase.' });
    }
    console.log(userId, verificationCode, useCase);

    const isVerify = await OtpVerification.findOne({ where: { userId, verificationCode, useCase } });

    if (!isVerify) {
      return res.status(400).json({ status: 'error', message: 'Invalid Verification code' });
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

