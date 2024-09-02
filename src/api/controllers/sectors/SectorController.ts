import { Request, Response } from 'express';

import { Sector } from '@/api/entity/sector/Sector';
import { SubCategory } from '@/api/entity/sector/SubCategory';
import { Service } from '@/api/entity/sector/Service';

export const getAllSectors = async (req: Request, res: Response) => {
  try {
    const sectors = await Sector.find();
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

    if (!sectorId && !sectorName) {
      res.status(400).json({ status: 'error', message: 'Provide sectorId or sectorName' });
      return;
    }

    let yourSector 
    if(sectorId)
    {
      yourSector = await Sector.findOne({ where: { id: sectorId } });
    }
    else
    {
      yourSector = await Sector.findOne({ where: { sectorName } });
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
    const { categoryId } = req.body;
    const subCategories = await SubCategory.find({ where: { categoryId } });
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

export const getServicesSubCategoryWise = async (req: Request, res: Response) => {
  try {

    const { subCategoryId } = req.body;
    const services = await Service.find({ where: { subCategoryId } });

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