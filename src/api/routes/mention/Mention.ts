import { Router } from 'express';
import { PostMention, getMention, getAllMention, deleteMention } from '@/api/controllers/mention/mention';

const router = Router();

router.post('/mention', PostMention);
router.get('/mention/getAll', getAllMention);
router.get('/mention/:id', getMention);
router.delete('/mention/:id', deleteMention);

export default router;
