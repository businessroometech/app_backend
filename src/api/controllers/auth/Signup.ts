import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { UserSectorCategory } from '@/api/entity/user/UserSectorCategory';
import { getConnection } from 'typeorm';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    const { mobileNumber, password, fullName, emailAddress, primaryRole, userType, sectorId, categoryId, createdBy, updatedBy } = req.body;

    if (!mobileNumber || !password) {
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    const existingUser = await queryRunner.manager.findOne(UserLogin, { where: { mobileNumber } });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered',
        data: { user: existingUser },
      });
      await queryRunner.rollbackTransaction();
      return;
    }

    const newUser = queryRunner.manager.create(UserLogin, {
      mobileNumber,
      password,
      primaryRole: primaryRole || 'ServiceProvider',
      userType: userType || 'Individual',
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system',
    });
    await queryRunner.manager.save(newUser);

    const usc = queryRunner.manager.create(UserSectorCategory, {
      userId: newUser.id,
      sectorCategoryAssociation: [{ sectorId, categoryIds: [categoryId] }],
      createdBy: createdBy || 'system',
      updatedBy: updatedBy || 'system',
    });
    await queryRunner.manager.save(usc);

    const personalDetails = queryRunner.manager.create(PersonalDetails, {
      mobileNumber,
      sectorId,
      userLoginId: newUser.id,
      fullName,
      emailAddress: emailAddress || null,
    });
    await queryRunner.manager.save(personalDetails);

    await queryRunner.commitTransaction();

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
    await queryRunner.rollbackTransaction();
    console.error('Error during signup:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.' });
  } finally {
    await queryRunner.release();
  }
};
