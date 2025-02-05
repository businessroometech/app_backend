import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { AppDataSource } from '@/server';
import { Notifications } from '@/api/entity/notifications/Notifications';

export const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);
    const user = await personalDetailsRepo.findOne({ where: { emailAddress: email } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.active === 1) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }
    if (user.active === -1) {
      return res.status(400).json({ success: false, message: 'User blocked to use this plateform!' });
    }

    // Generate a verification token
    const verificationToken = jwt.sign({ userId: user.id }, process.env.ACCESS_SECRET_KEY!, { expiresIn: '1h' });

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173/auth/sign-in'}?token=${verificationToken}`;

    // Configure nodemailer
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
      subject: "Businessroom.ai! Verify Your Email Address",
      html: `
      <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification || Businessroom AI</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #e3f2fd;
      font-family: Arial, sans-serif;
      color: #333333;
    "
  >
    <div
      style="
        max-width: 600px;
        margin: 50px auto;
        background: #ffffff;
        border-radius: 8px;
        border: 4px solid #007bff;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      "
    >
      <div style="background-color: #fff; padding: 20px; text-align: center">
       <a  href="https://businessroom.ai" style="
  display: inline-block;
  width: 50px; /* Adjust size as needed */
  height: 50px;
  background-color: #2196F3; /* Info blue */
  color: white;
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  line-height: 50px;
  border-radius: 12px; /* Rounded corners */
  text-decoration: none;
  font-family: Arial, sans-serif;
">b</a>
      </div>
      <div style="padding: 30px; text-align: center">
        <h1 style="font-size: 24px; color: #007bff; margin-bottom: 10px">
          Welcome to businessroom!
        </h1>
        <p>Hi,</p>
        <p>
          Thank you for signing up. Please verify your email by clicking the
          link below:
        </p>
        <a
          href="${verificationLink}"
          style="
            display: inline-block;
            margin: 20px 0;
            padding: 12px 20px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            font-size: 16px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          "
          >Verify Email</a
        >
        <p
          id="timer"
          style="margin: 20px 0; font-size: 18px; color: #ff0000"
        >
          This link will expire in 1 hour.
        </p>
        <p>If you did not sign up, please ignore this email.</p>
        <p>Thank you,</p>
        <p>Team businessRoom</p>
      </div>
      <div
        style="
          text-align: center;
          padding: 20px;
          background: #f1f1f1;
          font-size: 14px;
          color: #777777;
        "
      >
        <p>&copy; <span id="year"></span> businessroom. All rights reserved.</p>
        <p>
          <a
            href="https://businessroom.ai"
            style="color: #007bff; text-decoration: none"
            >Visit our website</a
          >
        </p>
      </div>
    </div>

    <script>
      document.getElementById("year").textContent = new Date().getFullYear();

      function startTimer(duration, display) {
        let timer = duration,
          minutes,
          seconds;
        const interval = setInterval(function () {
          minutes = parseInt(timer / 60, 10);
          seconds = parseInt(timer % 60, 10);

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent =
            "This link will expire in " + minutes + ":" + seconds;

          if (--timer < 0) {
            clearInterval(interval);
            display.textContent = "This link has expired.";
          }
        }, 1000);
      }

      window.onload = function () {
        const oneHour = 60 * 60;
        const display = document.getElementById("timer");
        startTimer(oneHour, display);
      };
    </script>
  </body>
</html>

      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({
        status: 'error',
        message: 'Verification token is missing.',
      });
      return;
    }

    // Verify the token
    const decoded: any = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
    const userId = decoded?.userId;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid or expired token.',
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found.',
      });
      return;
    }

    if (user.active === 1) {
      res.status(400).json({
        status: 'error',
        message: 'Email is already verified.',
      });
      return;
    }

    user.active = 1;
    await userRepository.save(user);

    res.status(200).json({
      status: 'success',
      message: 'Email successfully verified. You can now log in.',
    });

    // Create a login notification
    const notificationRepos = AppDataSource.getRepository(Notifications);
    const notification = notificationRepos.create({
      userId: user.id,
      message: 'Your email has been successfully verified. Welcome to Businessroom.ai!',
      navigation: '/',
    });

    await notificationRepos.save(notification);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};
