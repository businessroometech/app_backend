/* eslint-disable prettier/prettier */


import { Router } from 'express';

import { CreateWishlist, DeleteEverything, deleteWishlist, geteveryWishlist } from '@/api/controllers/Wishlists/Wishlists';
const router = Router();

router.post('/create' , CreateWishlist);

router.get("/every" , geteveryWishlist)

router.delete("/deleteeverything" , DeleteEverything)


router.delete("/delete/:id" , deleteWishlist)



export default router