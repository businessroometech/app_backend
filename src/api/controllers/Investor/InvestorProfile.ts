import { Request, Response } from 'express';

import { AppDataSource } from '@/server';

import { Investor } from '../../entity/Investors/Investor';

export const createInvestor = async (req: Request, res: Response) => {
  try {
    const investorRepository = AppDataSource.getRepository(Investor);
    const investor = investorRepository.create(req.body);
    const results = await investorRepository.save(investor);

    return res.status(201).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error creating investor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create investor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllInvestors = async (req: Request, res: Response) => {
  try {
    const investorRepository = AppDataSource.getRepository(Investor);
    const investors = await investorRepository.find();

    return res.status(200).json({
      success: true,
      data: investors,
    });
  } catch (error) {
    console.error('Error fetching investors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch investors',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getInvestorById = async (req: Request, res: Response) => {
  try {
    const investorRepository = AppDataSource.getRepository(Investor);
    const investor = await investorRepository.findOne({
      where: { UserId: req.params.UserId },
    });

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: investor,
    });
  } catch (error) {
    console.error('Error fetching investor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch investor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateInvestor = async (req: Request, res: Response) => {
  try {
    const investorRepository = AppDataSource.getRepository(Investor);
    const investor = await investorRepository.findOne({
      where: { id: req.params.id },
    });

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found',
      });
    }

    investorRepository.merge(investor, req.body);
    const results = await investorRepository.save(investor);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error updating investor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update investor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteInvestor = async (req: Request, res: Response) => {
  try {
    const investorRepository = AppDataSource.getRepository(Investor);
    const result = await investorRepository.delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Investor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete investor',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
