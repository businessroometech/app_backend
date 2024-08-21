import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { UserSectorCategory } from '@/api/entity/user/UserSectorCategory';

export const signup = async (req: Request, res: Response): Promise<void> => {

  try {
    const { mobileNumber, password, fullName, emailAddress, primaryRole, userType, sectorId, categoryId, createdBy, updatedBy } = req.body;

    if (!mobileNumber || !password) {
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    const existingUser = await UserLogin.findOne({ where: { mobileNumber } });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered',
        data: { user: existingUser },
      });
      return;
    }

    const newUser = await UserLogin.create({
      mobileNumber,
      password,
      primaryRole: primaryRole || 'ServiceProvider',
      userType: userType || 'Individual',
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system',
    }).save();

    const usc = await UserSectorCategory.create({
      userId: newUser.id,
      sectorCategoryAssociation: [{ sectorId, categoryIds: [categoryId] }],
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system',
    }).save();

    const personalDetails = await PersonalDetails.create({
      fullName,
      mobileNumber,
      sectorId,
      userId: newUser.id,
      emailAddress: emailAddress || null,
    }).save();


    res.status(201).json({
      status: 'success',
      message: 'Signup completed',
      data: {
        user: newUser,
        userSectorCategory: usc,
        personalDetails,
      },
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.' });
  }
};
