/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { AppDataSource } from '@/server';

import { BusinessBuyer } from '../../entity/BusinessBuyer/BusinessBuyer';



export const createBusinessBuyer = async (req: Request, res: Response) => {
  try {
    const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
    const businessBuyer = businessBuyerRepository.create(req.body);
    const results = await businessBuyerRepository.save(businessBuyer);

    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error creating business buyer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create business buyer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllBusinessBuyers = async (req: Request, res: Response) => {
  try {
    const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
    const businessBuyers = await businessBuyerRepository.find();

    return res.status(200).json({
      success: true,
      data: businessBuyers,
    });
  } catch (error) {
    console.error('Error fetching business buyers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business buyers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getBusinessBuyerById = async (req: Request, res: Response) => {
  try {
    const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
    const businessBuyer = await businessBuyerRepository.findOne({
      where: { UserId: req.params.UserId },
    });

    if (!businessBuyer) {
      return res.status(404).json({
        success: false,
        message: 'Business buyer not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: businessBuyer,
    });
  } catch (error) {
    console.error('Error fetching business buyer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business buyer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateBusinessBuyer = async (req: Request, res: Response) => {
  try {
    const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
    const businessBuyer = await businessBuyerRepository.findOne({
      where: { id: req.params.id },
    });

    if (!businessBuyer) {
      return res.status(404).json({
        success: false,
        message: 'Business buyer not found',
      });
    }

    businessBuyerRepository.merge(businessBuyer, req.body);
    const results = await businessBuyerRepository.save(businessBuyer);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error updating business buyer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update business buyer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteBusinessBuyer = async (req: Request, res: Response) => {
  try {
    const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
    const result = await businessBuyerRepository.delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business buyer not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business buyer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting business buyer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete business buyer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
