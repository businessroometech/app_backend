/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { AppDataSource } from '@/server';

import { BusinessBuyer } from '../../entity/BusinessBuyer/BusinessBuyer';

//hellooo//

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

// export const updateBusinessBuyer = async (req: Request, res: Response) => {
//   try {
//     const { UserId } = req.params;
//     if (!UserId) {
//       return res.status(400).json({
//         success: false,
//         message: 'UserId parameter is required',
//       });
//     }

//     const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
//     const businessBuyer = await businessBuyerRepository.findOneBy({ UserId });

//     if (!businessBuyer) {
//       return res.status(404).json({
//         success: false,
//         message: 'Business buyer not found',
//       });
//     }

//     businessBuyerRepository.merge(businessBuyer, req.body);
//     const updatedBusinessBuyer = await businessBuyerRepository.save(businessBuyer);

//     return res.status(200).json({
//       success: true,
//       data: updatedBusinessBuyer, // Consider returning only necessary fields
//     });
//   } catch (error) {
//     console.error('Error updating business buyer:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update business buyer',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// };



export const UpdateBusinessBuyer = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {  
      businessType, 
      businessLocation, 
      businessModel, 
      budget, 
      renovationInvestment, 
      timeline, 
      growthOrStableCashFlow, 
      supportAfterPurchase, 
      ndaAgreement, 
      additionalInfo 
    } = req.body;
const UserId = req.params.UserId
    // Get the BusinessBuyer repository
    const buyerRepository = AppDataSource.getRepository(BusinessBuyer);
    console.log("-----------------" , UserId)
    // Check if the buyer profile exists
    const buyerProfile = await buyerRepository.findOne({ where: { UserId } });
       console.log("-----------------" , buyerProfile)
    if (!buyerProfile) {
      return res.status(404).json({
        message: 'Business buyer not found. Invalid Buyer ID.',
      });
    }

    // Update the buyer profile fields
    buyerProfile.UserId = UserId;
    buyerProfile.businessType = businessType;
    buyerProfile.businessLocation = businessLocation;
    buyerProfile.businessModel = businessModel;
    buyerProfile.budget = budget;
    buyerProfile.renovationInvestment = renovationInvestment;
    buyerProfile.timeline = timeline;
    buyerProfile.growthOrStableCashFlow = growthOrStableCashFlow;
    buyerProfile.supportAfterPurchase = supportAfterPurchase;
    buyerProfile.ndaAgreement = ndaAgreement;
    buyerProfile.additionalInfo = additionalInfo;

    await buyerRepository.save(buyerProfile);

    return res.status(200).json({
      message: 'Business buyer updated successfully.',
      data: buyerProfile,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: 'Internal server error. Could not update business buyer.',
      error: error.message,
    });
  }
};








export const deleteBusinessBuyer = async (req: Request, res: Response) => {
  try {
    const businessBuyerRepository = AppDataSource.getRepository(BusinessBuyer);
    
    // Delete all business buyers related to the given userId
    const result = await businessBuyerRepository.delete({ UserId: req.params.UserId });

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: 'No business buyers found for the given userId',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All business buyers deleted successfully for the given userId',
    });
  } catch (error) {
    console.error('Error deleting business buyers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete business buyers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
