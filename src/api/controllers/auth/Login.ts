import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { AppDataSource } from '@/server';
import { createNotification } from '../notifications/notificationController';
import { Notifications } from '@/api/entity/notifications/Notifications';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';

const generateAccessToken = (user: { id: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id }, process.env.ACCESS_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_ACCESS_EXPIRES_IN_REMEMBER : process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

const generateRefreshToken = (user: { id: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER : process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password, rememberMe = false } = req.body;
//     const { token } = req.query;

//     if (!email || !password) {
//       res.status(400).json({
//         status: 'fail',
//         message: 'Please provide an email and password.',
//       });
//       return;
//     }

//     const userLoginRepository = AppDataSource.getRepository(PersonalDetails);
//     let user: PersonalDetails | null = null;

//     if (token) {
//       let payload: any;
//       try {
//         payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
//       } catch (err) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Invalid or expired token.',
//         });
//         return;
//       }

//       const { userId } = payload;
//       user = await userLoginRepository.findOne({ where: { id: userId } });

//       if (!user) {
//         res.status(404).json({
//           status: 'error',
//           message: 'User not found.',
//         });
//         return;
//       }

//       if (user.active === 0) {
//         user.active = 1;
//         await userLoginRepository.save(user);
//       }
//     } else {

//       user = await userLoginRepository.findOne({ where: { emailAddress: email } });

//       if (!user || !(await PersonalDetails.validatePassword(password, user.password))) {
//         res.status(401).json({
//           status: 'error',
//           message: 'Invalid email or password.',
//         });
//         return;
//       }

//       if (user.active === 0) {
//         res.status(403).json({
//           status: 'fail',
//           message: 'Account not verified. Please check your email for verification link.',
//         });
//         return;
//       }

//       if (user.active === -1) {
//         res.status(403).json({
//           status: 'fail',
//           message: 'Account is blocked. Please contact support.',
//         });
//         return;
//       }
//     }

//     const accessToken = generateAccessToken(user, rememberMe);

//     res.status(200).json({
//       status: 'success',
//       message: 'Logged in successfully.',
//       data: {
//         accessToken,
//         user,
//       },
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong! Please try again later.',
//     });
//   }
// };

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const { token } = req.query;

    if (!email || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide an email and password.',
      });
      return;
    }

    const userLoginRepository = AppDataSource.getRepository(PersonalDetails);
    let user: PersonalDetails | null = null;

    if (token) {
      let payload: any;
      try {
        payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
      } catch (err) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid or expired token.',
        });
        return;
      }

      const { userId } = payload;
      user = await userLoginRepository.findOne({ where: { id: userId } });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found.',
        });
        return;
      }

      if (user.active === 0) {
        user.active = 1;
        await userLoginRepository.save(user);
      }
    } else {

      user = await userLoginRepository.findOne({ where: { emailAddress: email } });

      if (!user) {
        res.status(400).json({
          status: 'error',
          message: 'User not found.',
        });
        return;
      }

      if (user.active === 0) {
        res.status(403).json({
          status: 'fail',
          message: 'Account not verified. Please check your email for verification link.',
        });
        return;
      }

      if (!(await PersonalDetails.validatePassword(password, user.password))) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password.',
        });
        return;
      }

      if (user.active === -1) {
        res.status(403).json({
          status: 'fail',
          message: 'Account is blocked. Please contact support.',
        });
        return;
      }
    }

    const accessToken = generateAccessToken(user, rememberMe);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken,
        user,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};


// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password, rememberMe = false } = req.body;
//     const { token } = req.query;

//     if (!email && !token) {
//       res.status(400).json({
//         status: 'fail',
//         message: 'Please provide either email/password or a valid token',
//       });
//       return;
//     }

//     const userLoginRepository = AppDataSource.getRepository(PersonalDetails);
//     let user: PersonalDetails | null = null;

//     if (token) {
//       try {
//         const payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
//         const { userId }: any = payload;

//         user = await userLoginRepository.findOne({
//           where: { id: userId }
//         });

//         if (!user) {
//           res.status(400).json({
//             status: 'fail',
//             message: 'User not found with the provided token',
//           });
//           return;
//         }

//         if (user.active === 0) {
//           user.active = 1;
//           await userLoginRepository.save(user);
//         }
//       } catch (err) {
//         if (err instanceof jwt.TokenExpiredError) {
//           res.status(401).json({
//             status: 'fail',
//             message: 'Token has expired. Please request a new verification email.',
//           });
//         } else {
//           res.status(401).json({
//             status: 'fail',
//             message: 'Invalid authentication token',
//           });
//         }
//         return;
//       }
//     }
//     else {
//       if (!password) {
//         res.status(400).json({
//           status: 'fail',
//           message: 'Password is required for email login',
//         });
//         return;
//       }

//       user = await userLoginRepository.findOne({
//         where: { emailAddress: email },
//         select: ['id', 'emailAddress', 'firstName', 'lastName', 'password', 'active', 'userRole']
//       });

//       if (!user || !(await PersonalDetails.validatePassword(password, user.password))) {
//         res.status(401).json({
//           status: 'fail',
//           message: 'Invalid email or password',
//         });
//         return;
//       }

//       if (user.active === 0) {
//         res.status(403).json({
//           status: 'fail',
//           message: 'Account not verified. Please check your email for verification link.',
//         });
//         return;
//       }

//       if (user.active === -1) {
//         res.status(403).json({
//           status: 'fail',
//           message: 'Account is blocked. Please contact support.',
//         });
//         return;
//       }
//     }

//     const accessToken = generateAccessToken(user, rememberMe);

//     const userResponse = {
//       id: user.id,
//       email: user.emailAddress,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       role: user.userRole,
//       isVerified: user.active === 1
//     };

//     res.status(200).json({
//       status: 'success',
//       message: 'Login successful',
//       data: {
//         accessToken,
//         user: userResponse
//       },
//     });

//   } catch (error: any) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'An unexpected error occurred. Please try again later.',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'businessroomai@gmail.com',
    pass: 'eshqmhxhvmxonqfe',
  },
});

export const farmaan = async (req: Request, res: Response) => {
  try {
    // const { recipients } = req.body;
    const recipients = ['govravmahobeofficial@gmail.com', 'ashutoshnegi195@gmail.com']
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients array is required and cannot be empty' });
    }

    const mailOptions = {
      from: 'businessroomai@gmail.com',
      to: recipients,
      subject: 'BusinessRoom is Now Live! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #2c3e50;">Dear User,</h1>
          <p>We are excited to announce that <strong>BusinessRoom</strong> is now live! 🎉</p>
          <p>BusinessRoom is a social media platform for startups. We invite you to sign up today and start exploring all the incredible features that will help you grow and connect with other businesses.</p>
          <h3>How to sign up:</h3>
          <ul>
            <li>Visit <a href="https://www.businessroom.ai" style="color: #3498db; text-decoration: none;">www.businessroom.ai</a>.</li>
            <li>Create your account.</li>
            <li>Start using BusinessRoom to enhance your business connections.</li>
          </ul>
          <p>Don’t miss out on this exciting opportunity. <strong>Sign up now</strong> and take your business to the next level!</p>
          <p>If you have any questions, please reply to this email.</p>
          <br>
          <p>Best regards,</p>
          <p><strong>The BusinessRoom Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ status: "success", message: 'Notification email sent successfully to all recipients' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ status: "error", message: 'Failed to send notification email' });
  }
};

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const disable = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const userRepo = AppDataSource.getRepository(PersonalDetails);

    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(400).json({ status: "error", message: "User not found" });
    }

    if (user.active === 0) {
      return res.status(400).json({ status: "error", message: "User is already disabled" });
    }

    user.active = 0;

    await userRepo.save(user);

    return res.status(200).json({ status: "success", message: "User disabled successfully" });
  } catch (error) {
    console.error("Error disabling user:", error);
    return res.status(500).json({ status: "error", message: "Something went wrong" });
  }
};
