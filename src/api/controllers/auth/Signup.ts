import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import validator from 'validator';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { Ristriction } from '@/api/entity/ristrictions/Ristriction';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { isDisposable } from '../../middlewares/disposable-mail/disposable';

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
//       country,
//       countryCode,
//       mobileNumber,
//       gender,
//       dob,
//       userRole,
//       linkedIn,
//       createdBy = 'system',
//       updatedBy = 'system',
//     } = req.body;

//     // Validation checks
//     if (!firstName || !lastName || !emailAddress || !password || !country) {
//       res.status(400).json({ status: 'error', message: 'All fields are required' });
//       return;
//     }

//     if (!validator.isEmail(emailAddress)) {
//       res.status(400).json({ status: 'error', message: 'Invalid email address format.' });
//       return;
//     }

//     if (dob && isNaN(Date.parse(dob))) {
//       res.status(400).json({ status: 'error', message: 'Invalid date of birth format.' });
//       return;
//     }

//     const passwordMinLength = 8;
//     if (
//       password.length < passwordMinLength ||
//       !/[A-Z]/.test(password) ||
//       !/[a-z]/.test(password) ||
//       !/[0-9]/.test(password)
//     ) {
//       res.status(400).json({
//         status: 'error',
//         message: 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and digits.',
//       });
//       return;
//     }

//     if (firstName.length > 50 || lastName.length > 50) {
//       res.status(400).json({
//         status: 'error',
//         message: 'First name and last name must not exceed 50 characters.',
//       });
//       return;
//     }

//     const userLoginRepository = queryRunner.manager.getRepository(PersonalDetails);
//     const restrictionRepository = queryRunner.manager.getRepository(Ristriction);

//     // Check for duplicate email
//     const existingUser = await userLoginRepository.findOne({ where: { emailAddress } });
//     if (existingUser) {
//       res.status(400).json({ status: 'error', message: 'Email already exists.' });
//       return;
//     }

//     // Check for duplicate mobile number
//     if (mobileNumber) {
//       const existingMobile = await userLoginRepository.findOne({ where: { mobileNumber } });
//       if (existingMobile) {
//         res.status(400).json({ status: 'error', message: 'Mobile number already exists.' });
//         return;
//       }
//     }

//     // Create new user (initially inactive)
//     const newUser = userLoginRepository.create({
//       firstName,
//       lastName,
//       emailAddress,
//       password,
//       country,
//       countryCode,
//       mobileNumber: mobileNumber?.trim() ? mobileNumber : null,
//       gender,
//       userRole,
//       dob,
//       active: 1,
//       linkedIn,
//       createdBy,
//       updatedBy,
//     });

//     const user = await userLoginRepository.save(newUser);

//     // Create restriction
//     const restriction = restrictionRepository.create({
//       userId: user?.id,
//     });
//     await restrictionRepository.save(restriction);

//     // Generate verification token
//     // const verificationToken = jwt.sign(
//     //   { userId: user.id },
//     //   process.env.ACCESS_SECRET_KEY!,
//     //   { expiresIn: '1h' }
//     // );

//     // const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?token=${verificationToken}`;

//     // Configure email transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.EMAIL_PORT || '465'),
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER || 'businessroom.ai@gmail.com',
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

//     await Promise.all([
// //       transporter.sendMail({
// //         from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
// //         to: user.emailAddress,
// //         subject: "Verify Your Email Address - Businessroom.ai",
// //         html: `
// //          <html lang="en">
// // <head>
// //   <meta charset="UTF-8">
// //   <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //   <title>Email Verification</title>
// //   <style>
// //     body {
// //       margin: 0;
// //       padding: 0;
// //       background-color: #e3f2fd; /* Light sky-blue background */
// //       font-family: Arial, sans-serif;
// //       color: #333333;
// //     }
// //     .email-container {
// //       max-width: 600px;
// //       margin: 50px auto;
// //       background: #ffffff;
// //       border-radius: 8px;
// //       border: 4px solid #007bff; /* Border color matching logo */
// //       overflow: hidden;
// //       box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
// //     }
// //     .header {
// //       // background-color: #007bff; /* Primary blue */
// //             background:rgba(255, 255, 255, 0.78);
// //       padding: 20px;
// //       text-align: center;
// //     }
// //     .header img {
// //       width: 130px;
// //     }
// //     .content {
// //       padding: 30px;
// //       text-align: center;
// //     }
// //     .content h1 {
// //       font-size: 24px;
// //       color: #007bff;
// //       margin-bottom: 10px;
// //     }
// //     .content p {
// //       line-height: 1.6;
// //       font-size: 16px;
// //     }
// //     .verify-button {
// //       display: inline-block;
// //       margin: 20px 0;
// //       padding: 12px 20px;
// //       background-color: #007bff;
// //       color: #ffffff;
// //       text-decoration: none;
// //       font-size: 16px;
// //       border-radius: 6px;
// //       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
// //     }
// //     .verify-button:hover {
// //       background-color: #0056b3;

// //     }
// //     .timer {
// //       margin: 20px 0;
// //       font-size: 18px;
// //       color: #ff0000;
// //     }
// //     .footer {
// //       text-align: center;
// //       padding: 20px;
// //       background: #f1f1f1;
// //       font-size: 14px;
// //       color: #777777;
// //     }
// //     .footer a {
// //       color: #007bff;
// //       text-decoration: none;
// //     }
// //   </style>
// // </head>
// // <body>
// //   <div class="email-container">
// //     <div class="header">
// //       <img src="https://i.ibb.co/jkLMQZT3/title-logo.png" alt="BusinessRoom Logo">
// //     </div>
// //     <div class="content">
// //       <h1>Welcome to BusinessRoom!</h1>
// //       <p>Hi,</p>
// //       <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
// //       <a href="${verificationLink}" class="verify-button">Verify Email</a>
// //       <p class="timer" id="timer">This link will expire in 1 hour.</p>
// //       <p>If you did not sign up, please ignore this email.</p>
// //       <p>Thank you,</p>
// //       <p>The BusinessRoom Team</p>
// //     </div>
// //     <div class="footer">
// //       <p>&copy; <span id="year"></span> BusinessRoom. All rights reserved.</p>

// // <script>
// //   // Dynamically set the current year
// //   document.getElementById("year").textContent = new Date().getFullYear();
// // </script>
// //       <p>
// //         <a href="https://businessroom.ai">Visit our website</a>
// //       </p>
// //     </div>
// //   </div>

// //   <script>
// //     // Timer script to show the countdown
// //     function startTimer(duration, display) {
// //       let timer = duration, minutes, seconds;
// //       const interval = setInterval(function () {
// //         minutes = parseInt(timer / 60, 10);
// //         seconds = parseInt(timer % 60, 10);

// //         minutes = minutes < 10 ? "0" + minutes : minutes;
// //         seconds = seconds < 10 ? "0" + seconds : seconds;

// //         display.textContent = "This link will expire in " + minutes + ":" + seconds;

// //         if (--timer < 0) {
// //           clearInterval(interval);
// //           display.textContent = "This link has expired.";
// //         }
// //       }, 1000);
// //     }

// //     window.onload = function () {
// //       const oneHour = 60 * 60; // 1 hour in seconds
// //       const display = document.getElementById("timer");
// //       startTimer(oneHour, display);
// //     };
// //   </script>
// // </body>
// // </html>
// //         `,
// //       }),

//       // Admin notification email
//       transporter.sendMail({
//         from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
//         to: 'arunmanchanda9999@gmail.com',
//         subject: 'New Signup 🎉',
//         html: `
//           <h3>Hello Admin,</h3>
//           <p>A new user has signed up!</p>
//           <ul>
//             <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
//             <li><strong>Email:</strong> ${user.emailAddress}</li>
//             <li><strong>Mobile:</strong> ${user.mobileNumber || 'Not provided'}</li>
//             <li><strong>LinkedIn Profile:</strong> ${user.linkedIn || 'Not provided'}</li>
//             <li><strong>Role:</strong> ${user.userRole}</li>
//           </ul>
//           <p>Best,<br>Your Team</p>
//         `
//       })
//     ]);

//     await queryRunner.commitTransaction();

//     res.status(201).json({
//       status: 'success',
//       message: 'Signup completed successfully.',
//       data: {
//         id: user.id,
//         email: user.emailAddress,
//         firstName: user.firstName,
//         lastName: user.lastName
//       },
//     });

//   } catch (error: any) {
//     await queryRunner.rollbackTransaction();
//     console.error('Error during signup:', error);

//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong! Please try again later.',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   } finally {
//     await queryRunner.release();
//   }
// };

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
      countryCode,
      mobileNumber,
      gender,
      dob,
      userRole,
      linkedIn,
      createdBy = 'system',
      updatedBy = 'system',
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !emailAddress || !password || !country) {
      res.status(400).json({ status: 'error', message: 'All fields are required' });
      return;
    }

    if (isDisposable(emailAddress)) {
      res.status(400).json({ status: 'error', message: 'Disposable email addresses not allowed' });
      return;
    }

    if (!validator.isEmail(emailAddress)) {
      res.status(400).json({ status: 'error', message: 'Invalid email address format.' });
      return;
    }

    if (dob && isNaN(Date.parse(dob))) {
      res.status(400).json({ status: 'error', message: 'Invalid date of birth format.' });
      return;
    }

    // Validate password
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
          'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and digits.',
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
    const restrictionRepository = queryRunner.manager.getRepository(Ristriction);

    // Check if email exists
    const existingUser = await userLoginRepository.findOne({ where: { emailAddress } });
    if (existingUser) {
      res.status(400).json({ status: 'error', message: 'Email already exists.' });
      return;
    }

    // Check if mobile number exists
    if (mobileNumber) {
      const existingMobile = await userLoginRepository.findOne({ where: { mobileNumber } });
      if (existingMobile) {
        res.status(400).json({ status: 'error', message: 'Mobile number already exists.' });
        return;
      }
    }

    // Create new user
    const newUser = userLoginRepository.create({
      firstName,
      lastName,
      emailAddress,
      password,
      country,
      countryCode,
      mobileNumber: mobileNumber?.trim() ? mobileNumber : null,
      gender,
      userRole,
      dob,
      active: 0,
      linkedIn,
      createdBy,
      updatedBy,
    });

    const user = await userLoginRepository.save(newUser);

    // Create restriction entry
    const restriction = restrictionRepository.create({
      userId: user.id,
      connectionCount: 50,
    });

    await restrictionRepository.save(restriction);

    // Generate verification token
    const verificationToken = jwt.sign({ userId: user.id }, process.env.ACCESS_SECRET_KEY!, { expiresIn: '1h' });

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'businessroom.ai@gmail.com',
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send verification email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
      to: user.emailAddress,
      subject: 'Verify Your Email Address - Businessroom.ai',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; text-align: center;">
            <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px;">
              <h2>Welcome to BusinessRoom!</h2>
              <p>Thank you for signing up. Please verify your email by clicking the button below:</p>
              <a href="${verificationLink}" 
                 style="display: inline-block; background: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px;">
                Verify Email
              </a>
              <p style="color: red;">This link will expire in 1 hour.</p>
              <p>If you did not sign up, please ignore this email.</p>
              <p>Thanks,</p>
              <p>The BusinessRoom Team</p>
            </div>
          </body>
        </html>
      `,
    });

    await queryRunner.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Signup successful. Please verify your email.',
      data: { user },
    });
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Error during signup:', error);
    res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.', error });
  } finally {
    await queryRunner.release();
  }
};
