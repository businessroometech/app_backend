import nodemailer from "nodemailer";
import { Account } from "@/api/entity/LandingPage/Account";
import { Connect } from "@/api/entity/LandingPage/Connect";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";
import { QueryFailedError } from "typeorm";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "ashutoshnegi196@gmail.com",
        pass: "ctcbnmvlouaildzd",
    },
});

// export const getInTouch = async (req: Request, res: Response) => {
//     try {
//         const { firstName, lastName, emailAddress, phoneNumber, select, message } = req.body;

//         const connectRepo = AppDataSource.getRepository(Connect);
//         const con = connectRepo.create({ firstName, lastName, emailAddress, phoneNumber, select, message });
//         await con.save();

//         await transporter.sendMail({
//             from: "ashutoshnegi196@gmail.com",
//             to: "arunmanchanda9999@gmail.com",
//             subject: "New Contact Request Received",
//             text: `New contact request received:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${emailAddress}\nPhone: ${phoneNumber}\nCategory: ${select}\nMessage: ${message}`,
//         });

//         return res.status(200).json({ status: "success", message: "Query sent and email notification delivered", data: { query: con } });
//     } catch (error) {
//         return res.status(500).json({ status: "error", message: "Error sending query" });
//     }
// };

export const getInTouch = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, emailAddress, phoneNumber, select, message } = req.body;

        const connectRepo = AppDataSource.getRepository(Connect);

        // Check if email or phone number already exists
        const existingEmail = await connectRepo.findOne({ where: { emailAddress } });
        if (existingEmail) {
            return res.status(400).json({ status: "error", message: "Email address already exists." });
        }

        const existingPhone = await connectRepo.findOne({ where: { phoneNumber } });
        if (existingPhone) {
            return res.status(400).json({ status: "error", message: "Phone number already exists." });
        }

        // Create new contact request
        const con = connectRepo.create({ firstName, lastName, emailAddress, phoneNumber, select, message });
        await con.save();

        // Send email notification
        await transporter.sendMail({
            from: "ashutoshnegi196@gmail.com",
            to: "arunmanchanda9999@gmail.com",
            subject: "New Contact Request Received",
            text: `New contact request received:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${emailAddress}\nPhone: ${phoneNumber}\nCategory: ${select}\nMessage: ${message}`,
        });

        return res.status(200).json({ status: "success", message: "Query sent and email notification delivered", data: { query: con } });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes("duplicate key") || errorMessage.includes("unique constraint")) {
                if (errorMessage.includes("emailAddress")) {
                    return res.status(400).json({ status: "error", message: "Email address already exists." });
                } else if (errorMessage.includes("phoneNumber")) {
                    return res.status(400).json({ status: "error", message: "Phone number already exists." });
                }
            }
        }

        return res.status(500).json({ status: "error", message: "Error sending query" });
    }
};

// export const createAccount = async (req: Request, res: Response) => {
//     try {
//         const { firstName, lastName, emailAddress, phoneNumber, countryCode, country, role } = req.body;

//         const accountRepo = AppDataSource.getRepository(Account);
//         const acc = accountRepo.create({ firstName, lastName, emailAddress, countryCode, country, phoneNumber, role });
//         await acc.save();

//         await transporter.sendMail({
//             from: "ashutoshnegi196@gmail.com",
//             to: "arunmanchanda9999@gmail.com",
//             subject: "New Account Signup Request",
//             text: `New signup request received:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${emailAddress}\nPhone: ${phoneNumber}\nCountry Code: ${countryCode}\nCountry: ${country}\nRole: ${role}`,
//         });

//         return res.status(200).json({ status: "success", message: "Signup request sent and email notification delivered", data: { account: acc } });
//     } catch (error) {
//         return res.status(500).json({ status: "error", message: "Error sending signup request" });
//     }
// };

export const createAccount = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, emailAddress, phoneNumber, countryCode, country, role } = req.body;

        const accountRepo = AppDataSource.getRepository(Account);

        // Check if email or phone number already exists
        const existingEmail = await accountRepo.findOne({ where: { emailAddress } });
        if (existingEmail) {
            return res.status(400).json({ status: "error", message: "Email address already exists." });
        }

        const existingPhone = await accountRepo.findOne({ where: { phoneNumber } });
        if (existingPhone) {
            return res.status(400).json({ status: "error", message: "Phone number already exists." });
        }

        // Create new account
        const acc = accountRepo.create({ firstName, lastName, emailAddress, countryCode, country, phoneNumber, role });
        await acc.save();

        // Send email notification
        await transporter.sendMail({
            from: "ashutoshnegi196@gmail.com",
            to: "arunmanchanda9999@gmail.com",
            subject: "New Account Signup Request",
            text: `New signup request received:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${emailAddress}\nPhone: ${phoneNumber}\nCountry Code: ${countryCode}\nCountry: ${country}\nRole: ${role}`,
        });

        return res.status(200).json({ status: "success", message: "Signup request sent and email notification delivered", data: { account: acc } });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes("duplicate key") || errorMessage.includes("unique constraint")) {
                if (errorMessage.includes("emailAddress")) {
                    return res.status(400).json({ status: "error", message: "Email address already exists." });
                } else if (errorMessage.includes("phoneNumber")) {
                    return res.status(400).json({ status: "error", message: "Phone number already exists." });
                }
            }
        }

        return res.status(500).json({ status: "error", message: "Error sending signup request" });
    }
};
