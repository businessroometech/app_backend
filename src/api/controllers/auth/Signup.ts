import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import validator from 'validator';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { sendNotification } from '../notifications/SocketNotificationController';

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
      dob,
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

    const newUser = userLoginRepository.create({
      firstName,
      lastName,
      emailAddress,
      password,
      country,
      userRole,
      dob,
      createdBy,
      updatedBy,
    });

    const user = await userLoginRepository.save(newUser);

    // Generate a verification token
    const verificationToken = jwt.sign({ userId: newUser.id }, process.env.ACCESS_SECRET_KEY!, { expiresIn: '1h' });

    // Send verification email
    await sendVerificationEmail(newUser.emailAddress, verificationToken);

    await queryRunner.commitTransaction();
    const media = null;
    let notification = await sendNotification(
      user.id,
     `${firstName} ${lastName}, Welcome! to Businessroom.ai, let's complete your profile`,
      media,
      `/settings/account`
    );

    if (notification) {
      res.status(201).json({
        status: 'success',
        message: 'Signup completed successfully. Please verify your email.',
        data: {
          user: newUser
        },
      });
    }
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

// Send the verification email
const sendVerificationEmail = async (email: string, verificationToken: string) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173/auth/sign-in'}?token=${verificationToken}`;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'ashutoshnegi196@gmail.com',
        pass: 'ctcbnmvlouaildzd',
      },
    });

    // Email content
    const mailOptions = {
      from: 'ashutoshnegi196@gmail.com',
      to: email,
      subject: 'Verify Your Email Address',
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
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
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
