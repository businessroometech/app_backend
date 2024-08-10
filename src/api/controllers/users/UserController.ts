import { Request, Response } from 'express';

import { EducationalDetails } from '@/api/entity/profile/educational/other/EducationalDetails';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { ProfessionalDetails } from '@/api/entity/profile/professional/ProfessionalDetails';
// import { UserDetails } from '@/api/entity/user/UserDetails';

// export const getUserDetails = async (req: Request, res: Response) => {
//   try {
//     const { mobileNumber, sectorId } = req.body;
//     const details = await UserDetails.findOne({ where: { mobileNumber, sectorId } });
//     res.status(200).json({
//       status: 'success',
//       message: `User details fetched for ${mobileNumber}`,
//       data: {
//         userDetails: details,
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching user details :', error);
//     res.status(500).json({ status: 'error', message: 'Failed to fetch user details' });
//   }
// };
