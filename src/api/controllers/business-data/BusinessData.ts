import { Request, Response } from 'express';
import { InvestorData } from "@/api/entity/business-data/InvestorData";

import { AppDataSource } from "@/server";
import { AquiringStartup } from '@/api/entity/business-data/AquiringStartup';
import { ExploringIdeas } from '@/api/entity/business-data/ExploringIdeas';
import { SeekingConnections } from '@/api/entity/business-data/SeekingConnections';
import { SellingStartup } from '@/api/entity/business-data/SellingStartup';
import { Repository } from 'typeorm';
import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import multer from 'multer';
import { uploadBufferDocumentToS3 } from '../s3/awsControllers';
import { BasicSelling } from '@/api/entity/business-data/BasicSelling';
import { Ristriction } from '@/api/entity/ristrictions/Ristriction';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

const storage = multer.memoryStorage();
export const uploadLogoMiddleware = multer({ storage: storage }).single('file');

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
            basicSelling: AppDataSource.getRepository(BasicSelling)
        };

        const repository = repositories[subRole];

        const userRepo = AppDataSource.getRepository(PersonalDetails);
        const user = await userRepo.findOne({ where: { id: userId } });


        if (!repository) {
            return res.status(400).json({ status: "fail", message: "Invalid subRole provided" });
        }

        let savedData;

        if (subRole === "sellingStartup") {

            if (req.file) {
                const file = req.file;
                const uploadedUrl = await uploadBufferDocumentToS3(file.buffer, userId, file.mimetype);
                data["businessLogo"] = uploadedUrl?.fileKey;
            }

            if (id) {
                const existingData = await repository.findOne({ where: { id, userId, isHidden: false } });

                if (!existingData) {
                    return res.status(404).json({ status: "fail", message: "Record not found" });
                }

                for (const key in data) {
                    if (data[key] !== undefined && !(Array.isArray(data[key]) && data[key].length === 0) && data[key] !== '') {
                        (existingData as any)[key] = data[key];
                    }
                }

                savedData = await repository.save(existingData);
                await user?.save();
            } else {
                const newData = repository.create({ userId, ...data });
                savedData = await repository.save(newData);
                await user?.save();
            }
        } else {
            let existingData = await repository.findOne({ where: { userId, isHidden: false } });
            if (existingData) {

                for (const key in data) {
                    if (data[key] !== undefined && !(Array.isArray(data[key]) && data[key].length === 0) && data[key] !== '') {
                        (existingData as any)[key] = data[key];
                    }
                }

                savedData = await repository.save(existingData);

                user!.subRole = subRole;
                await user?.save();
            } else {
                const newData = repository.create({ userId, ...data });
                savedData = await repository.save(newData);

                user!.subRole = subRole;
                await user?.save();
            }

            // ----------------------------------------restriction------------------------------

            const restrictionRepo = AppDataSource.getRepository(Ristriction);
            const restrictMy = await restrictionRepo.findOne({ where: { userId } });

            if (restrictMy) {
                restrictMy.isBusinessProfileCompleted = true;
                await restrictionRepo.save(restrictMy);
            }

            //----------------------------------------------------------------------------------

        }


        return res.status(200).json({
            status: "success",
            message: "Business profile created or updated",
            data: { businessData: savedData }
        });

    } catch (error: any) {
        console.error("Error in createOrUpdateInvestorData:", error);
        return res.status(500).json({
            status: "error",
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
            basicSelling: AppDataSource.getRepository(BasicSelling)
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

        const { profileId } = req.query;

        let userId: any = req.userId;

        if (profileId) userId = profileId;

        const userRepo = AppDataSource.getRepository(PersonalDetails);
        const user = await userRepo.findOne({ where: { id: userId } });
        const subRole: any = user?.subRole;

        const repositories: Record<string, Repository<any>> = {
            investor: AppDataSource.getRepository(InvestorData),
            aquiringStartup: AppDataSource.getRepository(AquiringStartup),
            exploringIdeas: AppDataSource.getRepository(ExploringIdeas),
            seekingConnection: AppDataSource.getRepository(SeekingConnections),
            basicSelling: AppDataSource.getRepository(BasicSelling)
            // sellingStartup: AppDataSource.getRepository(SellingStartup),
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

        return res.status(200).json({ status: "success", message: "business profile fetched", data: { businessData: data, subRole: user?.subRole, userName: `${user?.firstName} ${user?.lastName}` } });
    } catch (error: any) {
        return res.status(500).json({ status: "error", message: "Internal server error", error: error.message });
    }
};