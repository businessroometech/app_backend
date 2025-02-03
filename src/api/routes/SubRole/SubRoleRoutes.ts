/* eslint-disable prettier/prettier */
import { Router } from 'express';
const router = Router();
import { createSubrole, deleteRoles, getAllSubRole, getSubRoleByUniqueId } from '@/api/controllers/Subrole.ts/SubRole';


router.post('/create', createSubrole);

router.get('/get/:UserId', getSubRoleByUniqueId);

router.get('/getall' , getAllSubRole)

router.delete("/delete/:id" , deleteRoles)

export default router