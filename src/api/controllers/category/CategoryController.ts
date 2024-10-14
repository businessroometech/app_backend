import { Request, Response } from 'express';

import { Category } from '@/api/entity/sector/Category';
import { AppDataSource } from '@/server';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { sectorId } = req.body;

    const categoryRepository = AppDataSource.getRepository(Category);
    
    let categories;
    if(!sectorId) categories = await categoryRepository.find();
    else categories = await categoryRepository.find({ where: { sectorId } });

    res.status(200).json({
      status: 'success',
      message: 'Fetched categories successfully',
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
};

export const postCategories = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  const { sectorId, categoryName, categoryDescription } = req.body;

  // Validate request body
  if (!sectorId) return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Sector ID' });

  if (!categoryName) return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Category Name' });

  try {
    const categoryRepository = AppDataSource.getRepository(Category);

    // Create and save the new category
    const newCategory = categoryRepository.create({
      sectorId,
      categoryName,
      categoryDescription: categoryDescription || null,
    });

    await categoryRepository.save(newCategory);

    return res.status(201).json({ status: 'Successful', message: 'Category created successfully' });
  } catch (error) {
    console.error('Error while creating category:', error);
    return res.status(500).json({ status: 'Unsuccessful', message: 'Server error while creating category' });
  } finally {
    await queryRunner.release();
  }
};
