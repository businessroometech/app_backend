/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { AppDataSource } from '@/server';

import { BusinessForSale } from '../../entity/BuisnessSeller/BuisnessSeller';
import { generatePresignedUrl } from '../s3/awsControllers';

export const createBusinessForSale = async (req: Request, res: Response) => {
  try {
    const businessRepository = AppDataSource.getRepository(BusinessForSale);
    const business = businessRepository.create(req.body);
    const results = await businessRepository.save(business);

    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error creating business for sale:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create business for sale',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllBusinessesForSale = async (req: Request, res: Response) => {
  try {
    const businessRepository = AppDataSource.getRepository(BusinessForSale);
    const businesses = await businessRepository.find();

    return res.status(200).json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    console.error('Error fetching businesses for sale:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses for sale',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getBusinessForSaleByUniqueId = async (req: Request, res: Response) => {
  try {
    const businessRepository = AppDataSource.getRepository(BusinessForSale);
    const business = await businessRepository.findOne({
      where: { id: req.params.id },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }
    const logourl = business?.businessLogo ? await generatePresignedUrl(business.businessLogo) : null;
    const businessData = { ...business, logourl };

    return res.status(200).json({
      success: true,
      data: businessData,
    });
  } catch (error) {
    console.error('Error fetching business for sale:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business for sale',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getBusinessForSaleById = async (req: Request, res: Response) => {
    try {
        const businessRepository = AppDataSource.getRepository(BusinessForSale);
        const businesses = await businessRepository.find({
            where: { UserId: req.params.UserId },
        });
    
        if (!businesses || businesses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Business not found',
            });
        }
    
        const businessesData = await Promise.all(
            businesses.map(async (business) => ({
                ...business,
                logourl: business.businessLogo ? await generatePresignedUrl(business.businessLogo) : null,
            }))
        );
    
        return res.status(200).json({
            success: true,
            data: businessesData,
        });
    
  } catch (error) {
    console.error('Error fetching business for sale:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business for sale',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateBusinessForSale = async (req: Request, res: Response) => {
  try {
    const businessRepository = AppDataSource.getRepository(BusinessForSale);
    const business = await businessRepository.findOne({
      where: { id: req.params.id },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }
    
    businessRepository.merge(business, req.body);
    const results = await businessRepository.save(business);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error updating business for sale:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update business for sale',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteBusinessForSale = async (req: Request, res: Response) => {
  try {
    const businessRepository = AppDataSource.getRepository(BusinessForSale);
    const result = await businessRepository.delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting business for sale:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete business for sale',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
