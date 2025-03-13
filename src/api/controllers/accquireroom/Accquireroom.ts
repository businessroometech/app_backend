import { SellingStartup } from "@/api/entity/business-data/SellingStartup";
import { Wishlists } from "@/api/entity/WishLists/Wishlists";
import { AppDataSource } from "@/server";
import { Request, Response } from "express";


export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const getAllStartups = async (req: AuthenticatedRequest, res: Response) => {
    try {
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

        return res.json({
            success: true,
            data,
            pagination: {
                total,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(total / +limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error });
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

// // Add a startup to the wishlist
export const toggleWishlist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { seekingConnectionId } = req.body;
        const userId = req.userId;

        const wishlistRepo = AppDataSource.getRepository(Wishlists);

        const existingWishlist = await wishlistRepo.findOne({ where: { seekingConnectionId, userId } });

        if (existingWishlist) {
            existingWishlist.isHidden = !existingWishlist.isHidden;
        }
        else {
            const wishlist = Wishlists.create({
                seekingConnectionId,
                userId,
                isHidden: true
            })

            await wishlist.save();
        }

        return res.status(200).json({ status: "success", message: "Done." });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Server error", error });
    }
};

// // Remove a startup from the wishlist
// export const removeFromWishlist = async (req: Request, res: Response) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user.id;

//         const wishlistItem = await Wishlists.findOne({ where: { id, userId } });

//         if (!wishlistItem) {
//             return res.status(404).json({ success: false, message: "Item not found" });
//         }

//         await Wishlists.remove(wishlistItem);
//         return res.json({ success: true, message: "Removed from wishlist" });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: "Server error", error });
//     }
// };

// Get my wishlist with pagination, businessType filter & search
export const getMyWishlist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, businessType, search } = req.query;

        const wishlistRepo = AppDataSource.getRepository(Wishlists);

        const query = wishlistRepo.createQueryBuilder("wishlist")
            .leftJoinAndSelect("wishlist.seekingConnectionId", "startup")
            .where("wishlist.userId = :userId", { userId })
            .andWhere("wishlist.isHidden = :isHidden", { isHidden: false });

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
