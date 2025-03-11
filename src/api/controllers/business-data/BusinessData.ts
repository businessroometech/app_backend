import { Request, Response } from 'express';
import { InvestorData } from "@/api/entity/business-data/InvestorData";

import { AppDataSource } from "@/server";
import { AquiringStartup } from '@/api/entity/business-data/AquiringStartup';
import { ExploringIdeas } from '@/api/entity/business-data/ExploringIdeas';
import { SeekingConnections } from '@/api/entity/business-data/SeekingConnections';
import { SellingStartup } from '@/api/entity/business-data/SellingStartup';
import { Repository } from 'typeorm';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const createOrUpdateInvestorData = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const subRole = req.query.subRole as string;
        const userId = req.userId;
        const { id, ...data } = req.body; 

        const repositories: Record<string, Repository<any>> = {
            investor: AppDataSource.getRepository(InvestorData),
            aquiringStartup: AppDataSource.getRepository(AquiringStartup),
            exploringIdeas: AppDataSource.getRepository(ExploringIdeas),
            seekingConnection: AppDataSource.getRepository(SeekingConnections),
            sellingStartup: AppDataSource.getRepository(SellingStartup),
        };

        const repository = repositories[subRole];

        if (!repository) {
            return res.status(400).json({ status: "fail", message: "Invalid subRole provided" });
        }

        let savedData;

        if (subRole === "sellingStartup") {
            if (id) {
                const existingData = await repository.findOne({ where: { id, userId, isHidden: false } });

                if (!existingData) {
                    return res.status(404).json({ status: "fail", message: "Record not found" });
                }

                Object.assign(existingData, data);
                savedData = await repository.save(existingData);
            } else {
                const newData = repository.create({ userId, ...data });
                savedData = await repository.save(newData);
            }
        } else {
            let existingData = await repository.findOne({ where: { userId, isHidden: false } });
            if (existingData) {
                Object.assign(existingData, data); 
                savedData = await repository.save(existingData);
            } else {
                const newData = repository.create({ userId, ...data });
                savedData = await repository.save(newData);
            }
        }

        return res.status(200).json({
            status: "success",
            message: "Business profile created or updated",
            data: { businessData: savedData }
        });

    } catch (error: any) {
        console.error("Error in createOrUpdateInvestorData:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export const deleteInvestorData = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const subRole = req.query.subRole as string;

        const repositories: Record<string, Repository<any>> = {
            investor: AppDataSource.getRepository(InvestorData),
            aquiringStartup: AppDataSource.getRepository(AquiringStartup),
            exploringIdeas: AppDataSource.getRepository(ExploringIdeas),
            seekingConnection: AppDataSource.getRepository(SeekingConnections),
            sellingStartup: AppDataSource.getRepository(SellingStartup),
        };

        const repository = repositories[subRole];

        if (!repository) {
            return res.status(400).json({ status: "fail", message: "Invalid subRole provided" });
        }

        const data = await repository.findOne({ where: { id: id } });

        if (!data) {
            return res.status(404).json({ status: "fail", message: "data not found" });
        }

        data.isHidden = true;
        await repository.save(data);
        return res.status(200).json({ status: "success", message: "data deleted successfully" });
    } catch (error: any) {
        return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
};

export const getInvestorData = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const subRole = req.query.subRole as string;
        const userId = req.userId;

        const repositories: Record<string, Repository<any>> = {
            investor: AppDataSource.getRepository(InvestorData),
            aquiringStartup: AppDataSource.getRepository(AquiringStartup),
            exploringIdeas: AppDataSource.getRepository(ExploringIdeas),
            seekingConnection: AppDataSource.getRepository(SeekingConnections),
            sellingStartup: AppDataSource.getRepository(SellingStartup),
        };

        const repository = repositories[subRole];

        if (!repository) {
            return res.status(400).json({ status: "fail", message: "Invalid subRole provided" });
        }

        let data;

        if (userId) {
            data = await repository.find({ where: { userId, isHidden: false } });

            if (!data) {
                return res.status(404).json({ status: "fail", message: "data not found" });
            }
        } else {
            data = await repository.find();
        }

        return res.status(200).json({ status: "success", message: "business profile fetched", data: { businessData: data } });
    } catch (error: any) {
        return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
};