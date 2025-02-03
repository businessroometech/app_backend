/* eslint-disable prettier/prettier */

import { Request, Response } from 'express';

import { AppDataSource } from '@/server';

import { Entrepreneur } from '../../entity/Entrepreneur/EntrepreneurProfile';



export const createEntrepreneur = async (req: Request, res: Response) => {
    try {
        const entrepreneurRepository = AppDataSource.getRepository(Entrepreneur);
        const entrepreneur = entrepreneurRepository.create(req.body);
        const results = await entrepreneurRepository.save(entrepreneur);
        
        return res.status(201).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error creating entrepreneur:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create entrepreneur',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getAllEntrepreneurs = async (req: Request, res: Response) => {
    try {
        const entrepreneurRepository = AppDataSource.getRepository(Entrepreneur);
        const entrepreneurs = await entrepreneurRepository.find();
        
        return res.status(200).json({
            success: true,
            data: entrepreneurs
        });
    } catch (error) {
        console.error('Error fetching entrepreneurs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch entrepreneurs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getEntrepreneurById = async (req: Request, res: Response) => {
    try {
        const entrepreneurRepository = AppDataSource.getRepository(Entrepreneur);
        const entrepreneur = await entrepreneurRepository.findOne({
            where: { UserId: req.params.UserId }
        });

        if (!entrepreneur) {
            return res.status(404).json({
                success: false,
                message: 'Entrepreneur not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: entrepreneur
        });
    } catch (error) {
        console.error('Error fetching entrepreneur:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch entrepreneur',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const updateEntrepreneur = async (req: Request, res: Response) => {
    try {
        const entrepreneurRepository = AppDataSource.getRepository(Entrepreneur);
        const entrepreneur = await entrepreneurRepository.findOne({
            where: { id: req.params.id }
        });

        if (!entrepreneur) {
            return res.status(404).json({
                success: false,
                message: 'Entrepreneur not found'
            });
        }

        entrepreneurRepository.merge(entrepreneur, req.body);
        const results = await entrepreneurRepository.save(entrepreneur);

        return res.status(200).json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error updating entrepreneur:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update entrepreneur',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const deleteEntrepreneur = async (req: Request, res: Response) => {
    try {
        const entrepreneurRepository = AppDataSource.getRepository(Entrepreneur);
        const result = await entrepreneurRepository.delete(req.params.id);

        if (result.affected === 0) {
            return res.status(404).json({
                success: false,
                message: 'Entrepreneur not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Entrepreneur deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting entrepreneur:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete entrepreneur',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
