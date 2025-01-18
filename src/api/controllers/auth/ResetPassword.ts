import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { AppDataSource } from "@/server";

export const sendResetEmail = async (req: Request, res: Response) => {
  try {

    const { toEmail, resetLink } = req.body;

    const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);

    const user = await personalDetailsRepo.findOne({ where: { emailAddress: toEmail } });

    if (!user?.emailAddress) {
      return res.status(400).json({ status: "error", message: "User with this email doesn't exist" });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: "ashutoshnegi196@gmail.com",
        pass: "ctcbnmvlouaildzd"
      },
    });

    const resetToken = jwt.sign({ userId: user.id }, process.env.ACCESS_SECRET_KEY!, { expiresIn: "1h" });
    const newResetLink = `${resetLink}?token=${resetToken}`;
    const mailOptions = {
      from: 'ashutoshnegi196@gmail.com',
      to: toEmail,
      subject: "Reset Your Password",
      html: `
        <p>Hi,</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${newResetLink}">${newResetLink}</a>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,</p>
        <p>The BusinessRoom Team</p>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    res.status(200).json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
};


export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ status: "error", message: "Token and new password are required" });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.ACCESS_SECRET_KEY!);
    } catch (err) {
      return res.status(400).json({ status: "error", message: "Invalid or expired token" });
    }

    const { userId } = payload;

    const personalDetailsRepo = AppDataSource.getRepository(PersonalDetails);
    const user = await personalDetailsRepo.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await personalDetailsRepo.save(user);

    res.status(200).json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};