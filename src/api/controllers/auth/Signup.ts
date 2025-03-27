import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import validator from 'validator';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { Ristriction } from '@/api/entity/ristrictions/Ristriction';
import nodemailer from 'nodemailer';

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

    // Validation checks
    if (!firstName || !lastName || !emailAddress || !password || !country) {
      res.status(400).json({ status: 'error', message: 'All fields are required' });
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

    const passwordMinLength = 8;
    if (
      password.length < passwordMinLength ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and digits.',
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

    // Check for duplicate email
    const existingUser = await userLoginRepository.findOne({ where: { emailAddress } });
    if (existingUser) {
      res.status(400).json({ status: 'error', message: 'Email already exists.' });
      return;
    }

    // Check for duplicate mobile number
    if (mobileNumber) {
      const existingMobile = await userLoginRepository.findOne({ where: { mobileNumber } });
      if (existingMobile) {
        res.status(400).json({ status: 'error', message: 'Mobile number already exists.' });
        return;
      }
    }

    // Create new user (initially inactive)
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

    // Create restriction
    const restriction = restrictionRepository.create({
      userId: user?.id,
    });
    await restrictionRepository.save(restriction);

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_SECRET_KEY!,
      { expiresIn: '1h' }
    );

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?token=${verificationToken}`;

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'businessroom.ai@gmail.com',
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await Promise.all([
      transporter.sendMail({
        from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
        to: user.emailAddress,
        subject: "Verify Your Email Address - Businessroom.ai",
        html: `
         <html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #e3f2fd; /* Light sky-blue background */
      font-family: Arial, sans-serif;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 50px auto;
      background: #ffffff;
      border-radius: 8px;
      border: 4px solid #007bff; /* Border color matching logo */
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #007bff; /* Primary blue */
      padding: 20px;
      text-align: center;
    }
    .header img {
      max-width: 120px;
    }
    .content {
      padding: 30px;
      text-align: center;
    }
    .content h1 {
      font-size: 24px;
      color: #007bff;
      margin-bottom: 10px;
    }
    .content p {
      line-height: 1.6;
      font-size: 16px;
    }
    .verify-button {
      display: inline-block;
      margin: 20px 0;
      padding: 12px 20px;
      background-color: #007bff;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .verify-button:hover {
      background-color: #0056b3;
     
    }
    .timer {
      margin: 20px 0;
      font-size: 18px;
      color: #ff0000;
    }
    .footer {
      text-align: center;
      padding: 20px;
      background: #f1f1f1;
      font-size: 14px;
      color: #777777;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="../../../assets/logo2.png" alt="BusinessRoom Logo">
    </div>
    <div class="content">
      <h1>Welcome to BusinessRoom!</h1>
      <p>Hi,</p>
      <p>Thank you for signing up. Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}" class="verify-button">Verify Email</a>
      <p class="timer" id="timer">This link will expire in 1 hour.</p>
      <p>If you did not sign up, please ignore this email.</p>
      <p>Thank you,</p>
      <p>The BusinessRoom Team</p>
    </div>
    <div class="footer">
      <p>&copy; <span id="year"></span> BusinessRoom. All rights reserved.</p>

<script>
  // Dynamically set the current year
  document.getElementById("year").textContent = new Date().getFullYear();
</script>
      <p>
        <a href="https://businessroom.ai">Visit our website</a>
      </p>
    </div>
  </div>

  <script>
    // Timer script to show the countdown
    function startTimer(duration, display) {
      let timer = duration, minutes, seconds;
      const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = "This link will expire in " + minutes + ":" + seconds;

        if (--timer < 0) {
          clearInterval(interval);
          display.textContent = "This link has expired.";
        }
      }, 1000);
    }

    window.onload = function () {
      const oneHour = 60 * 60; // 1 hour in seconds
      const display = document.getElementById("timer");
      startTimer(oneHour, display);
    };
  </script>
</body>
</html>
        `,
      }),

      // Admin notification email
      transporter.sendMail({
        from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
        to: 'arunmanchanda9999@gmail.com',
        subject: 'New Signup 🎉',
        html: `
          <h3>Hello Admin,</h3>
          <p>A new user has signed up!</p>
          <ul>
            <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
            <li><strong>Email:</strong> ${user.emailAddress}</li>
            <li><strong>Mobile:</strong> ${user.mobileNumber || 'Not provided'}</li>
            <li><strong>LinkedIn Profile:</strong> ${user.linkedIn || 'Not provided'}</li>
            <li><strong>Role:</strong> ${user.userRole}</li>
          </ul>
          <p>Best,<br>Your Team</p>
        `
      })
    ]);

    await queryRunner.commitTransaction();

    res.status(201).json({
      status: 'success',
      message: 'Signup completed successfully. Please check your email to verify your account.',
      data: {
        id: user.id,
        email: user.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      },
    });

  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('Error during signup:', error);

    res.status(500).json({ 
      status: 'error', 
      message: 'Something went wrong! Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await queryRunner.release();
  }
};

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

//     try {
//       const restriction = restrictionRepository.create({
//         userId: user?.id,
//       });

//       await restrictionRepository.save(restriction);
//     } catch (restrictionError) {
//       console.error('Error creating restriction:', restrictionError);
//       await queryRunner.rollbackTransaction();
//       res.status(500).json({ status: 'error', message: 'Failed to create restriction. Please try again later.' });
//       return;
//     }

//     await queryRunner.commitTransaction();

//     const transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//       port: 465,
//       secure: true,
//       auth: {
//         user: 'businessroom.ai@gmail.com',
//         pass: 'eshqmhxhvmxonqfe',
//       },
//     });

//     try {
//       const mailOptions = {
//         from: 'businessroomai@gmail.com',
//         to: 'arunmanchanda9999@gmail.com',
//         subject: 'New Signup 🎉',
//         html: `<h3>Hello Arun,</h3>
//                <p>A new user has signed up!</p>
//                <ul>
//                  <li><strong>Name:</strong>${user.firstName} ${user.lastName}</li>
//                  <li><strong>Email:</strong>${user.emailAddress}</li>
//                  <li><strong>Mobile:</strong>${user.mobileNumber}</li>
//                  <li><strong>Linked Profile:</strong>${user.linkedIn}</li>
//                  <li><strong>Role:</strong>${user.userRole}</li>
//                  </ul>
//               <p>Best,<br>Your Team</p>`
//       };

//       await transporter.sendMail(mailOptions);
//       res.status(200).json({ status: "success", message: 'New registration' });
//     } catch (error) {
//       console.error('Error sending email:', error);
//       res.status(500).json({ status: "error", message: 'Failed to send email' });
//     }

//     try {

//       const verificationToken = jwt.sign(
//         { userId: user.id },
//         process.env.ACCESS_SECRET_KEY!,
//         { expiresIn: '1h' }
//       );

//       const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin?token=${verificationToken}`;

//       // Email content
//       const mailOptions = {
//         from: process.env.EMAIL_FROM || 'businessroomai@gmail.com',
//         to: user.emailAddress,
//         subject: "Businessroom.ai - Verify Your Email Address",
//         html: `
//             <html lang="en">
//               <head>
//                 <meta charset="UTF-8" />
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//                 <title>Email Verification</title>
//               </head>
//               <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
//                 <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
//                   <div style="text-align: center; margin-bottom: 30px;">
//                     <a href="https://businessroom.ai" style="display: inline-block; background-color: #2196F3; color: white; 
//                       font-size: 32px; font-weight: 600; width: 50px; height: 50px; line-height: 50px; 
//                       border-radius: 12px; text-decoration: none;">
//                       b
//                     </a>
//                   </div>
                  
//                   <h1 style="color: #007bff; text-align: center;">Welcome to Businessroom.ai!</h1>
                  
//                   <p>Hi there,</p>
                  
//                   <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
                  
//                   <div style="text-align: center; margin: 25px 0;">
//                     <a href="${verificationLink}" 
//                        style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
//                        color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
//                       Verify Email Address
//                     </a>
//                   </div>
                  
//                   <p style="color: #666; font-size: 14px;">
//                     This link will expire in 1 hour. If you didn't request this, please ignore this email.
//                   </p>
                  
//                   <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
//                     <p style="color: #999; font-size: 12px;">
//                       &copy; ${new Date().getFullYear()} Businessroom.ai. All rights reserved.
//                     </p>
//                   </div>
//                 </div>
//               </body>
//             </html>
//             `,
//       };

//       await transporter.sendMail(mailOptions);

//     } catch (error) {

//     }

//     res.status(201).json({
//       status: 'success',
//       message: 'Signup completed successfully. Please verify your email.',
//       data: { user },
//     });
//   } catch (error: any) {
//     await queryRunner.rollbackTransaction();
//     console.error('Error during signup:', error);

//     res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.', error });
//   } finally {
//     await queryRunner.release();
//   }
// };
