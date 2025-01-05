import { Request, Response } from 'express';
import { UserLogin } from '../../entity/user/UserLogin';
import { AppDataSource } from '@/server';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const {
      fullName,
      emailAddress,
      password,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    // Validate required fields
    if (!emailAddress || !password || !fullName) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide a full name, email address, and password.',
      });
      return;
    }

    const userLoginRepository = queryRunner.manager.getRepository(UserLogin);

    // Check if the user already exists
    const existingUser = await userLoginRepository.findOne({
      where: { email: emailAddress },
    });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User with this email already exists.',
      });
      return;
    }

    // Create a new user instance
    const newUser = userLoginRepository.create({
      fullName,
      email: emailAddress,
      password,
      createdBy,
      updatedBy,
    });

    // Save the new user
    await userLoginRepository.save(newUser);

    // Commit transaction
    await queryRunner.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Signup completed successfully.',
      data: {
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
      },
    });
  } catch (error: any) {
    // Rollback transaction on error
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    console.error('Error during signup:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({
        status: 'error',
        message: 'This email is already in use.',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  } finally {
    await queryRunner.release();
  }
};
