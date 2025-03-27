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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verification | Businessroom.ai</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #f7fafc;
      font-family: 'Poppins', Arial, sans-serif;
      color: #4a5568;
      line-height: 1.6;
    }
    
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
    
    .header {
      background: #0281fb;
      padding: 30px 0;
      text-align: center;
    }
    
    .logo {
      display: inline-block;
      width: 60px;
      height: 60px;
      background-color: white;
      color: #0281fb;
      font-size: 36px;
      font-weight: 700;
      text-align: center;
      line-height: 60px;
      border-radius: 16px;
      text-decoration: none;
      margin-bottom: 20px;
    }
    
    .content {
      padding: 40px;
    }
    
    h1 {
      color: #1a365d;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 20px;
      text-align: center;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 25px;
    }
    
    .action-button {
      display: inline-block;
      padding: 14px 28px;
      background: #0281fb;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
      border-radius: 8px;
      margin: 25px 0;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
      transition: all 0.3s ease;
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      color: #ffffff;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
    }
    
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      background-color: #f8fafc;
      font-size: 14px;
      color: #718096;
    }
    
    .expiry-note {
      background-color: #fffaf0;
      border-left: 4px solid #ed8936;
      padding: 12px;
      margin: 20px 0;
      font-size: 14px;
    }
    
    .social-links {
      margin: 30px 0;
      text-align: center;
    }
    
    .social-icon {
      display: inline-block;
      margin: 0 10px;
      color: #4a5568;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://businessroom.ai" class="logo">b</a>
    </div>
    
    <div class="content">
      <h1>Welcome to Businessroom.ai!</h1>
      
      <p class="greeting">Hi ${user.firstName},</p>
      
      <p>Thank you for joining Businessroom.ai! We're excited to have you on board. To get started, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="action-button">Verify Email Address</a>
      </div>
      
      <div class="expiry-note">
        <p><strong>Note:</strong> This verification link will expire in 1 hour. If you didn't create an account with us, please disregard this email.</p>
      </div>
      
      <div class="divider"></div>
      
      <p>If you're having trouble clicking the button, copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #4a5568; background-color: #f8fafc; padding: 10px; border-radius: 4px;">${verificationLink}</p>
      
      <div class="social-links">
        <p>Connect with us:</p>
        <a href="#" class="social-icon">LinkedIn</a>
        <a href="#" class="social-icon">Twitter</a>
        <a href="#" class="social-icon">Facebook</a>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Businessroom.ai. All rights reserved.</p>
      <p>
        <a href="https://businessroom.ai" style="color: #4299e1; text-decoration: none;">Visit our website</a> | 
        <a href="#" style="color: #4299e1; text-decoration: none;">Privacy Policy</a> | 
        <a href="#" style="color: #4299e1; text-decoration: none;">Terms of Service</a>
      </p>
      <p style="font-size: 12px; margin-top: 10px;">Businessroom.ai, 123 Business Street, Tech City, TC 10001</p>
    </div>
  </div>
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
