/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { SubRole } from '@/api/entity/SubRole/Subrole';
import { AppDataSource } from '@/server';



export const createSubrole = async (req: Request, res: Response) => {
  try {
const SubroleRepositry = AppDataSource.getRepository(SubRole)
const subroles = SubroleRepositry.create(req.body)
const results = await SubroleRepositry.save(subroles)


    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error creating SubRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create SubRole',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getSubRoleByUniqueId = async (req: Request, res: Response) => {
  try {
    const SubRoleRepository = AppDataSource.getRepository(SubRole);
    const subrole = await SubRoleRepository.findOne({
      where: { UserId: req.params.UserId },
    });

    if (!subrole) {
      return res.status(404).json({
        success: false,
        message: 'subrole not found',
      });
    }
    

    return res.status(200).json({
      success: true,
      data: subrole,
    });
  } catch (error) {
    console.error('Error fetching subrole:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subrole',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


export const getAllSubRole = async (req: Request, res: Response) => {
  try {
    const SubRoleRepository = AppDataSource.getRepository(SubRole);
    const subroles = await SubRoleRepository.find();

    return res.status(200).json({
      success: true,
      data: subroles,
    });
  } catch (error) {
    console.error('Error fetching businesses for subroles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses for subroles',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


export const deleteRoles = async (req: Request, res: Response) => {
  try {
    const subRoleRepository = AppDataSource.getRepository(SubRole);
    
    // Delete all sub-roles related to the given userId
    const result = await subRoleRepository.delete({ UserId: req.params.UserId });

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sub-roles found for the given userId',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All sub-roles deleted successfully for the given userId',
    });
  } catch (error) {
    console.error('Error deleting sub-roles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete sub-roles',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};