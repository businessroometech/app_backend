import nodemailer from "nodemailer";
import { Account } from "@/api/entity/LandingPage/Account";
import { Connect } from "@/api/entity/LandingPage/Connect";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "ashutoshnegi196@gmail.com",
        pass: "ctcbnmvlouaildzd",
    },
});

export const getInTouch = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, emailAddress, phoneNumber, select, message } = req.body;

        const connectRepo = AppDataSource.getRepository(Connect);
        const con = connectRepo.create({ firstName, lastName, emailAddress, phoneNumber, select, message });
        await con.save();

        await transporter.sendMail({
            from: "ashutoshnegi196@gmail.com",
            to: "arunmanchanda9999@gmail.com",
            subject: "New Contact Request Received",
            text: `New contact request received:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${emailAddress}\nPhone: ${phoneNumber}\nCategory: ${select}\nMessage: ${message}`,
        });

        return res.status(200).json({ status: "success", message: "Query sent and email notification delivered", data: { query: con } });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Error sending query" });
    }
};

export const createAccount = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, emailAddress, phoneNumber, countryCode, country, role } = req.body;

        const accountRepo = AppDataSource.getRepository(Account);
        const acc = accountRepo.create({ firstName, lastName, emailAddress, countryCode, country, phoneNumber, role });
        await acc.save();

        await transporter.sendMail({
            from: "ashutoshnegi196@gmail.com",
            to: "arunmanchanda9999@gmail.com",
            subject: "New Account Signup Request",
            text: `New signup request received:\n\nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${emailAddress}\nPhone: ${phoneNumber}\nCountry Code: ${countryCode}\nCountry: ${country}\nRole: ${role}`,
        });

        return res.status(200).json({ status: "success", message: "Signup request sent and email notification delivered", data: { account: acc } });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Error sending signup request" });
    }
};
