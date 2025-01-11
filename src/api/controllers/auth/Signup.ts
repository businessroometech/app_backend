import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import validator from 'validator';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';

export const signup = async (req: Request, res: Response): Promise<void> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const {
      firstName,
      lastName,
      emailAddress,
      password,
      country,
      userRole,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    if (!firstName || !lastName || !emailAddress || !password || !country) {
      res.status(400).json({
        status: 'error',
        message: 'All fields are required: first name, last name, email address, country and password.',
      });
      return;
    }

    if (!validator.isEmail(emailAddress)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid email address format.',
      });
      return;
    }

    const passwordMinLength = 8;
    if (
      password.length < passwordMinLength ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      res.status(400).json({
        status: 'error',
        message:
          'Password must be at least 8 characters long and include uppercase letters, lowercase letters and digits.',
      });
      return;
    }

    if (firstName.length > 50 || lastName.length > 50) {
      res.status(400).json({
        status: 'error',
        message: 'First name and last name must not exceed 50 characters.',
      });
      return;
    }

    const userLoginRepository = queryRunner.manager.getRepository(PersonalDetails);
    const existingUser = await userLoginRepository.findOne({
      where: { emailAddress },
    });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User with this email already exists.',
      });
      return;
    }

    const newUser = userLoginRepository.create({
      firstName,
      lastName,
      emailAddress,
      password,
      country,
      userRole,
      createdBy,
      updatedBy,
    });



    await userLoginRepository.save(newUser);

    await queryRunner.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Signup completed successfully.',
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          emailAddress: newUser.emailAddress,
          country: newUser.country,
          userRole:newUser.userRole,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
        },
      },
    });
  } catch (error: any) {
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

// import { Request, Response } from 'express';
// import { UserLogin } from '../../entity/user/UserLogin';
// import { AppDataSource } from '@/server';

// export const signup = async (req: Request, res: Response): Promise<void> => {
//   const queryRunner = AppDataSource.createQueryRunner();
//   await queryRunner.connect();

//   try {
//     await queryRunner.startTransaction();

//     const {
//       firstName,
//       lastName,
//       emailAddress,
//       password,
//       createdBy = 'system',
//       updatedBy = 'system',
//     } = req.body;

//     // Validate required fields
//     if (!emailAddress || !password || !firstName || !lastName) {
//       res.status(400).json({
//         status: 'error',
//         message: 'Please provide a full name, email address, and password.',
//       });
//       return;
//     }

//     const userLoginRepository = queryRunner.manager.getRepository(UserLogin);

//     // Check if the user already exists
//     const existingUser = await userLoginRepository.findOne({
//       where: { email: emailAddress },
//     });

//     if (existingUser) {
//       res.status(400).json({
//         status: 'error',
//         message: 'User with this email already exists.',
//       });
//       return;
//     }

//     // Create a new user instance
//     const newUser = userLoginRepository.create({
//       firstName,
//       lastName,
//       email: emailAddress,
//       password,
//       createdBy,
//       updatedBy,
//     });

//     // Save the new user
//     await userLoginRepository.save(newUser);

//     // Commit transaction
//     await queryRunner.commitTransaction();

//     res.status(201).json({
//       status: 'success',
//       message: 'Signup completed successfully.',
//       data: {
//         user: {
//           id: newUser.id,
//           firstName: newUser.firstName,
//           lastName: newUser.lastName,
//           email: newUser.email,
//           createdAt: newUser.createdAt,
//           updatedAt: newUser.updatedAt,
//         },
//       },
//     });
//   } catch (error: any) {
//     // Rollback transaction on error
//     if (queryRunner.isTransactionActive) {
//       await queryRunner.rollbackTransaction();
//     }
//     console.error('Error during signup:', error);

//     if (error.code === 'ER_DUP_ENTRY') {
//       res.status(400).json({
//         status: 'error',
//         message: 'This email is already in use.',
//       });
//       return;
//     }

//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong! Please try again later.',
//     });
//   } finally {
//     await queryRunner.release();
//   }
// };