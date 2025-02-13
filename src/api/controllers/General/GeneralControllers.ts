/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { General } from '@/api/entity/General/GeneralProfile';
import { AppDataSource } from '@/server';


export const createGeneral = async (req: Request, res: Response) => {
  try {
    const GeneralRepository = AppDataSource.getRepository(General);
    const general = GeneralRepository.create(req.body);
    const results = await GeneralRepository.save(general);

    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error creating general:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create general',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllGeneral = async (req: Request, res: Response) => {
  try {
    const GeneralRepository= AppDataSource.getRepository(General);
    const general = await GeneralRepository.find();

    return res.status(200).json({
      success: true,
      data: general,
    });
  } catch (error) {
    console.error('Error fetching general:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch general',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


export const getGeneralById = async (req: Request, res: Response) => {
  try {
    const GeneralRepository = AppDataSource.getRepository(General);
    const general = await GeneralRepository.findOne({
      where: { UserId: req.params.UserId },
    });

    if (!general) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: general,
    });
  } catch (error) {
    console.error('Error fetching general:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch general',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const UpdateGeneral = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { UserId } = req.params;
    const updateData = req.body;

    // Get the Investor repository
    const GeneralRepository = AppDataSource.getRepository(General);

    // Check if the investor profile exists
    const GeneralProfile = await GeneralRepository.findOne({ where: { UserId } });

    if (!GeneralProfile) {
      return res.status(404).json({
        message: 'Investor not found. Invalid Investor ID.',
      });
    }

    // Merge the existing data with the new updates
    const updatedgeneral = { ...GeneralProfile, ...updateData };

    // Save the updated investor profile
    await GeneralRepository.save(updatedgeneral);

    return res.status(200).json({
      message: 'General updated successfully.',
      data: updatedgeneral,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not update general.',
      error: error.message,
    });
  }
};

export const deleteGeneral = async (req: Request, res: Response) => {
  try {
    const GeneralRepository = AppDataSource.getRepository(General);

    // Delete all investors related to the given userId
    const result = await GeneralRepository.delete({ UserId: req.params.UserId });

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: 'No General found for the given userId',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All General deleted successfully for the given userId',
    });
  } catch (error) {
    console.error('Error deleting General:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete General',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
