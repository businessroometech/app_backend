import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, password, firstName, lastName, sectorId, primaryRole, userType, createdBy, updatedBy } = req.body;

    if (!mobileNumber || !password) {
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    const existingUser = await UserLogin.findOne({ where: { mobileNumber } });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered',
        data: {
          user: existingUser,
        },
      });
      return;
    }

    const newUser = UserLogin.create({
      mobileNumber,
      password,
      primaryRole,
      userType,
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system',
    });

    await newUser.save();

    const personalDetails = await PersonalDetails.create({
      mobileNumber,
      sectorId,
      userLoginId: newUser.id,
      fullName: `${firstName} ${lastName}`
    }).save();

    res.status(201).json({
      status: 'success',
      message: 'Signup completed',
      data: {
        user: newUser,
        personalDetails,
      },
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.' });
  }
};
