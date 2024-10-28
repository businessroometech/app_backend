import { Request, Response } from 'express';

import { Sector } from '@/api/entity/sector/Sector';
import { SubCategory } from '@/api/entity/sector/SubCategory';
import { Service } from '@/api/entity/sector/Service';
import { Category } from '@/api/entity/sector/Category';
import { AppDataSource } from '@/server';
import { generatePresignedUrl } from '../awsFuctions/AwsFunctions';
import { UserCategoryMapping } from '@/api/entity/user/UserCategoryMapping';

export const getAllSectors = async (req: Request, res: Response) => {
  try {
    const sectorRepository = AppDataSource.getRepository(Sector);
    const sectors = await sectorRepository.find();

    const sectorsWithImageUrls = await Promise.all(sectors.map(async (sector) => {
      try {

        const imageUrlData = await generatePresignedUrl(sector.imageKey, process.env.AWS_S3_BUCKET || '');

        return {
          ...sector,
          imageUrl: imageUrlData || null,
        };
      } catch (error) {
        console.error(`Error fetching image for sector ${sector.id}:`, error);
        return { ...sector, imageUrl: null };
      }
    }));

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched the sectors',
      data: {
        sectors: sectorsWithImageUrls,
      },
    });
  } catch (error) {
    console.error('Error fetching sectors:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch sectors' });
  }
};


export const getSector = async (req: Request, res: Response) => {
  try {
    const { sectorId, sectorName } = req.body;

    const sectorRepository = AppDataSource.getRepository(Sector);

    if (!sectorId && !sectorName) {
      return res.status(400).json({ status: 'error', message: 'Provide sectorId or sectorName' });
    }

    let sector;
    if (sectorId) {
      sector = await sectorRepository.findOne({ where: { id: sectorId } });
    } else {
      sector = await sectorRepository.findOne({ where: { sectorName } });
    }

    if (!sector) {
      return res.status(404).json({ status: 'error', message: 'Sector not found' });
    }

    let imageUrl;
    try {
      imageUrl = await generatePresignedUrl(sector.imageKey, process.env.AWS_S3_BUCKET || '');
    } catch (error) {
      console.error(`Error fetching image for sector ${sector.id}:`, error);
      imageUrl = { url: null };
    }

    const sectorWithImageUrl = {
      ...sector,
      imageUrl: imageUrl
    };

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched the sector',
      data: {
        sector: sectorWithImageUrl,
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

    const subCategoriesWithImageUrls = await Promise.all(subCategories.map(async (subCategory) => {
      try {

        const imageUrlData = await generatePresignedUrl(subCategory.imageKey, process.env.AWS_S3_BUCKET || '');

        return {
          ...subCategory,
          imageUrl: imageUrlData || null,
        };
      } catch (error) {
        console.error(`Error fetching image for sector ${subCategory.id}:`, error);
        return { ...subCategory, imageUrl: null };
      }
    }));

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched all subCategories',
      data: {
        subCategories: subCategoriesWithImageUrls,
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

    const categoriesWithImageUrls = await Promise.all(categories.map(async (category) => {
      try {

        const imageUrlData = await generatePresignedUrl(category.imageKey, process.env.AWS_S3_BUCKET || '');
        console.log(imageUrlData);
        return {
          ...category,
          imageUrl: imageUrlData || null,
        };

      } catch (error) {
        console.error(`Error fetching image for sector ${category.id}:`, error);
        return { ...category, imageUrl: null };
      }
    }));

    console.log(categoriesWithImageUrls);

    res.status(200).json({
      status: 'success',
      message: 'Successfully fetched all categories',
      data: {
        categories: categoriesWithImageUrls,
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

export const getUserSectorCategoryMapping = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const userCategoryMappingRepository = AppDataSource.getRepository(UserCategoryMapping);
    const userCategoryMapping = await userCategoryMappingRepository.find({ where: { userId } });

    res.status(200).json({
      status: "success",
      message: "Succesfully fetched the user-category mapping",
      data: {
        userCategoryMapping,
      }
    })
  } catch (error) {
    console.error('Error fetching user-category mapping:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch user-category mapping' });
  }
}