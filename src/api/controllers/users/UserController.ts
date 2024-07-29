import { Request, Response } from 'express';

import { EducationalDetails } from '@/api/entity/profile/educational/other/EducationalDetails';
import { PersonalDetails } from '@/api/entity/profile/personal/PersonalDetails';
import { ProfessionalDetails } from '@/api/entity/profile/professional/ProfessionalDetails';
import { UserDetails } from '@/api/entity/user/UserDetails';

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, sectorId } = req.body;
    const details = await UserDetails.findOne({ where: { mobileNumber, sectorId } });
    res.status(200).json({
      status: 'success',
      message: `User details fetched for ${mobileNumber}`,
      data: {
        userDetails: details,
      },
    });
  } catch (error) {
    console.error('Error fetching user details :', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user details' });
  }
};

export const getPersonalDetails = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, sectorId } = req.body;
    const details = await PersonalDetails.findOne({ where: { mobileNumber, sectorId } });
    res.status(200).json({
      status: 'success',
      message: `User details fetched for ${mobileNumber}`,
      data: {
        personalDetails: details,
      },
    });
  } catch (error) {
    console.error('Error fetching personal details :', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch personal details' });
  }
};

export const getProfessionalDetails = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, sectorId } = req.body;
    const details = await ProfessionalDetails.findOne({ where: { mobileNumber, sectorId } });
    res.status(200).json({
      status: 'success',
      message: `User details fetched for ${mobileNumber}`,
      data: {
        professionalDetails: details,
      },
    });
  } catch (error) {
    console.error('Error fetching professional details :', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch professional details' });
  }
};

export const getEducationalDetails = async (req: Request, res: Response) => {
  try {
    const { mobileNumber, sectorId } = req.body;
    const details = await EducationalDetails.findOne({ where: { mobileNumber, sectorId } });
    res.status(200).json({
      status: 'success',
      message: `User details fetched for ${mobileNumber}`,
      data: {
        educationalDetails: details,
      },
    });
  } catch (error) {
    console.error('Error fetching educational details :', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch educational details' });
  }
};
