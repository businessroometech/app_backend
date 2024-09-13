import { Request, Response } from 'express';

import { Sector } from '@/api/entity/sector/Sector';
import { SubCategory } from '@/api/entity/sector/SubCategory';
import { Service } from '@/api/entity/sector/Service';
import { Category } from '@/api/entity/sector/Category';
import { AppDataSource } from '@/server';

export const getAllSectors = async (req: Request, res: Response) => {
  try {

    const sectorRepository = AppDataSource.getRepository(Sector);

    const sectors = await sectorRepository.find();
    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched the sector',
      data: {
        sector: sectors,
      },
    });
  } catch (error) {
    console.error('Error fetching sector:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch sector' });
  }
};

export const getSector = async (req: Request, res: Response) => {
  try {
    const { sectorId, sectorName } = req.body;

    const sectorRepository = AppDataSource.getRepository(Sector);

    if (!sectorId && !sectorName) {
      res.status(400).json({ status: 'error', message: 'Provide sectorId or sectorName' });
      return;
    }

    let yourSector
    if (sectorId) {
      yourSector = await sectorRepository.findOne({ where: { id: sectorId } });
    }
    else {
      yourSector = await sectorRepository.findOne({ where: { sectorName } });
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched the sector',
      data: {
        sector: yourSector,
      },
    });
  } catch (error) {
    console.error('Error fetching sector:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch sector' });
  }
};

export const getAllSubCategories = async (req: Request, res: Response) => {
  try {

    const subCategoryRepository = AppDataSource.getRepository(SubCategory);

    const { categoryId } = req.body;
    const subCategories = await subCategoryRepository.find({ where: { categoryId } });
    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched all subCategories',
      data: {
        subCategories,
      },
    });
  } catch (error) {
    console.error('Error fetching subCategories:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch subCategories' });
  }
};

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categoryRepository = AppDataSource.getRepository(Category);

    const { sectorId } = req.body;
    const categories = await categoryRepository.find({ where: { sectorId } });
    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched all categories',
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
};

export const getServicesSubCategoryWise = async (req: Request, res: Response) => {
  try {
    const serviceRepository = AppDataSource.getRepository(Service);

    const { subCategoryId } = req.body;
    const services = await serviceRepository.find({ where: { subCategoryId } });

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched all services offered',
      data: {
        servicesOffered: services,
      },
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch services' });
  }
}