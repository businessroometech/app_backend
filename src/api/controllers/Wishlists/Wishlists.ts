/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { Wishlists } from '@/api/entity/WishLists/Wishlists';
import { AppDataSource } from '@/server';


export const CreateWishlist = async (req: Request, res: Response) => {
    try {
        const WishlistRepository = AppDataSource.getRepository(Wishlists);

        const Wishlistdata = WishlistRepository.create(req.body);
        const results = await WishlistRepository.save(Wishlistdata);

        return res.status(201).json({
            success: true,
            data: results,
        });

    } catch (error) {
        console.error('Error in creating Wishlists:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create Wishlists',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const GetallWishlists = async(req : Request  , res : Response) => {
try {
    const WishlistReposritry = AppDataSource.getRepository(Wishlists)
    const Wishlistsdata = await WishlistReposritry.find({
    where :{ Identity : req.params.Identity}

    })
    
    if(!Wishlistsdata) {
        return res.status(404).json({
            success: false,
            message: 'Wishlists not found'
        });
    }
    return res.status(200).json({
        success: true,
        data: Wishlistsdata
    });

} catch (error) {
    console.log("error in getting Wishlists" , error)
    return res.status(500).json({
        success: false,
        message: 'Failed to create business for sale',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
}

}




export const geteveryWishlist = async (req: Request, res: Response) => {
    try {
        const WishlistRepository = AppDataSource.getRepository(Wishlists);
        const Wishlistdata = await WishlistRepository.find();
        
        return res.status(200).json({
            success: true,
            data: Wishlistdata
        });
    } catch (error) {
        console.error('Error fetching Wishlistdata :', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch Wishlist for sale',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};


export const DeleteEverything = async (req: Request, res: Response) => {
    try {
        const wishlistRepository = AppDataSource.getRepository(Wishlists);

        // Delete all records
        await wishlistRepository.clear(); // This deletes all rows without returning them

        return res.status(200).json({
            success: true,
            message: "All records have been deleted from Wishlists.",
        });
    } catch (error:any) {
        console.error("Error while deleting records:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting records.",
            error: error.message,
        });
    }
};



export const deleteWishlist = async (req: Request, res: Response) => {
    try {
        const WishlistRepository = AppDataSource.getRepository(Wishlists);
        const result = await WishlistRepository.delete(req.params.id);

        if (result.affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Wishlist deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Wishlist :', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete Wishlist for sale',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};