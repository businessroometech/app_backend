import { Router } from 'express';
import { authenticate } from '../../middlewares/auth/Authenticate';
import {
  PostMention,
  getMention,
  getAllMention,
  deleteMention,
  getUsersByName,
} from '@/api/controllers/mention/mention';

const router = Router();

router.post('/mention', authenticate, PostMention);
router.get('/mention/getAll', getAllMention); // admin auth needed
router.get('/mention/get-all-users-by-name', authenticate, getUsersByName);
router.get('/mention/:id', getMention); // admin auth needed
router.delete('/mention/:id', deleteMention); // admin auth needed

export default router;
