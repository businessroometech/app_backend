import { Request, Response } from 'express';
import { InvestorData } from "@/api/entity/business-data/InvestorData";
import { AppDataSource } from "@/server";

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const createOrUpdateInvestorData = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        let data = {};
        data = { userId, ...req.body };
        const repository = AppDataSource.getRepository(InvestorData);

        let investorData: {};

        const existingInvestorData = await repository.findOne({ where: { userId } });

        if (existingInvestorData) {
            if (existingInvestorData) {
                repository.merge(existingInvestorData, data);
                investorData = existingInvestorData;
            } else {
                return res.status(404).json({ message: "Investor data not found" });
            }
        } else {
            investorData = repository.create(data);
        }

        const savedInvestorData = await repository.save(investorData);
        return res.status(200).json(savedInvestorData);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const deleteInvestorData = async (req: Request, res: Response) => {
    try {
        const { investorId } = req.params;
        const investorRepository = AppDataSource.getRepository(InvestorData);

        const investorData = await investorRepository.findOne({ where: { id: investorId } });

        if (!investorData) {
            return res.status(404).json({ message: "Investor data not found" });
        }

        await investorRepository.remove(investorData);
        return res.status(200).json({ message: "Investor data deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const getInvestorData = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const investorRepository = AppDataSource.getRepository(InvestorData);

        let investorData;

        if (userId) {
            investorData = await investorRepository.findOne({ where: { userId } });

            if (!investorData) {
                return res.status(404).json({ message: "Investor data not found" });
            }
        } else {
            investorData = await investorRepository.find();
        }

        return res.status(200).json(investorData);
    } catch (error: any) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};