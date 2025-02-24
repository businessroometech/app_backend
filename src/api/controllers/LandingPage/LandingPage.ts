import { Account } from "@/api/entity/LandingPage/Account";
import { Connect } from "@/api/entity/LandingPage/Connect";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";

export const getInTouch = async (req: Request, res: Response) => {
    try {

        const { firstName, lastName, emailAddress, phoneNumber, select, message } = req.body;

        const connectRepo = AppDataSource.getRepository(Connect);

        const con = connectRepo.create({
            firstName,
            lastName,
            emailAddress,
            phoneNumber,
            select,
            message
        });

        await con.save();

        return res.status(200).json({ status: "success", message: "query sent", data: { query: con } });

    } catch (error) {
        return res.status(500).json({ status: "error", message: "error sending query" })
    }
}

export const createAccount = async (req: Request, res: Response) => {
    try {

        const { firstName, lastName, emailAddress, phoneNumber, countryCode, country, role } = req.body;

        const accountRepo = AppDataSource.getRepository(Account);

        const acc = accountRepo.create({
            firstName,
            lastName,
            emailAddress,
            countryCode,
            country,
            phoneNumber,
            role
        });

        await acc.save();

        return res.status(200).json({ status: "success", message: "signup request sent", data: { account: acc } });

    } catch (error) {
        return res.status(500).json({ status: "error", message: "error sending signup request" })
    }
}