import { Router } from 'express';

import { authenticate } from '@/api/middlewares/auth/Authenticate';

import {
    getAllStartups, getMyStartups, getMyWishlist, toggleWishlist
} from '../../controllers/accquireroom/Accquireroom';


const router = Router();

router.get("/startups", authenticate, getAllStartups); // ?page=1&limit=10&businessType=Tech&search=Google
router.get("/startups/my", authenticate, getMyStartups);
router.post("/wishlist/toggle", authenticate, toggleWishlist);
router.get("/wishlist/my", authenticate, getMyWishlist);

export default router;