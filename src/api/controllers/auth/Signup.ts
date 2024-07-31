import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, password, primaryRole, userType, createdBy, updatedBy } = req.body;

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

    res.status(201).json({
      status: 'success',
      message: 'Signup completed',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.' });
  }
};
