import { SellingStartup } from "@/api/entity/business-data/SellingStartup";
import { Wishlists } from "@/api/entity/WishLists/Wishlists";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";
import { In } from "typeorm";

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const getAllStartups = async (req: AuthenticatedRequest, res: Response) => {
    try {

        const userId = req.userId;

        const { page = 1, limit = 10, businessType, search } = req.query;

        const sellingRepo = AppDataSource.getRepository(SellingStartup);

        const query = sellingRepo.createQueryBuilder("startup");

        if (businessType) {
            query.andWhere("startup.businessType = :businessType", { businessType });
        }

        if (search) {
            query.andWhere("LOWER(startup.officialName) LIKE LOWER(:search)", { search: `%${search}%` });
        }

        const [data, total] = await query
            .skip((+page - 1) * +limit)
            .take(+limit)
            .getManyAndCount();

        const formattedData = await Promise.all(
            data.map(async (d) => {
                const wishlistRepo = AppDataSource.getRepository(Wishlists);
                const wishList = await wishlistRepo.findOne({ where: { userId, sellingStartupId: d.id, status: true } });
                return {
                    ...d,
                    wishlistStatus: wishList ? true : false
                };
            })
        );


        return res.json({
            status: "success",
            data: formattedData,
            pagination: {
                total,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(total / +limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Server error", error });
    }
};

export const getMyStartups = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, businessType, search } = req.query;

        const sellingRepo = AppDataSource.getRepository(SellingStartup);

        const query = sellingRepo.createQueryBuilder("startup").where("startup.userId = :userId", { userId });

        if (businessType) {
            query.andWhere("startup.businessType = :businessType", { businessType });
        }

        if (search) {
            query.andWhere("LOWER(startup.officialName) LIKE LOWER(:search)", { search: `%${search}%` });
        }

        const [data, total] = await query
            .skip((+page - 1) * +limit)
            .take(+limit)
            .getManyAndCount();

        return res.json({
            status: "success",
            data: {
                data,
                total,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(total / +limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Server error", error });
    }
};

export const toggleWishlist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { sellingStartupId } = req.body;
        const userId = req.userId;

        const startupRepo = AppDataSource.getRepository(SellingStartup);

        const startup = await startupRepo.findOne({ where: { id: sellingStartupId } });

        if (!startup) {
            return res.status(400).json({ status: "error", message: "Invalid sellingStartupId. Startup not found." });
        }

        const wishlistRepo = AppDataSource.getRepository(Wishlists);

        let existingWishlist = await wishlistRepo.findOne({ where: { sellingStartupId, userId } });

        if (existingWishlist) {
            existingWishlist.status = !existingWishlist.status;
            await wishlistRepo.save(existingWishlist);
        } else {
            const wishlist = wishlistRepo.create({
                sellingStartupId,
                userId,
                status: true
            });

            await wishlistRepo.save(wishlist);
        }

        return res.status(200).json({ status: "success", message: "Done." });
    } catch (error) {
        console.error("Error in toggleWishlist:", error);
        return res.status(500).json({ status: "error", message: "Server error", error });
    }
};

export const getMyWishlist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, businessType, search } = req.query;

        const wishlistRepo = AppDataSource.getRepository(Wishlists);
        const startupRepo = AppDataSource.getRepository(SellingStartup);

        const wishlists = await wishlistRepo.find({ where: { userId, status: true } });
        const startupIds = wishlists.map(wl => wl.id); 
        if (startupIds.length === 0) {
            return res.json({
                status: "success",
                data: { startups: [], total: 0, page: +page, limit: +limit, totalPages: 0 },
            });
        }

        let sellingStartups = await startupRepo.findBy({ id: In(startupIds) });

        if (businessType) {
            sellingStartups = sellingStartups.filter(startup => startup.businessType === businessType);
        }

        if (search) {
            const searchLower = search.toString().toLowerCase();
            sellingStartups = sellingStartups.filter(startup => 
                startup.officialName?.toLowerCase().includes(searchLower) ||
                startup.businessDescription?.toLowerCase().includes(searchLower)
            );
        }

        const total = sellingStartups.length;
        const totalPages = Math.ceil(total / +limit);
        const offset = (Number(page) - 1) * Number(limit);
        const paginatedStartups = sellingStartups.slice(offset, offset + Number(limit));

        return res.json({
            status: "success",
            data: { startups: paginatedStartups, total, page: +page, limit: +limit, totalPages },
        });
    } catch (error) {
        console.error("Error in getMyWishlist:", error);
        return res.status(500).json({ status: "error", message: "Server error" });
    }
};
