/* eslint-disable prettier/prettier */
import { Router } from 'express';

import { createSubrole, getSubRoleByUniqueId } from '@/api/controllers/Subrole.ts/SubRole';
const router = Router();

router.post('/create', createSubrole);

router.get('/get/:UserId', getSubRoleByUniqueId);
