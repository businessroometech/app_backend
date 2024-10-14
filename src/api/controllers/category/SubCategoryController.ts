import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { SubCategory } from '@/api/entity/sector/SubCategory';

export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.body;

    const subCategoryRepository = AppDataSource.getRepository(SubCategory);

    const categories = await subCategoryRepository.find({ where: { categoryId } });

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

export const postSubCategories = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  const { categoryId, subCategoryName, subCategoryDescription } = req.body;

  // Validate request body
  if (!categoryId) return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Category ID' });

  if (!subCategoryName)
    return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Sub-Category Name' });

  if (!subCategoryDescription)
    return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Sub-Category Description' });

  try {
    const subCategoryRepository = AppDataSource.getRepository(SubCategory);

    // Create and save the new category
    const newCategory = subCategoryRepository.create({
      categoryId,
      subCategoryName,
      subCategoryDescription: subCategoryDescription || null,
    });

    await subCategoryRepository.save(newCategory);

    return res.status(201).json({ status: 'Successful', message: 'Sub-Category created successfully' });
  } catch (error) {
    console.error('Error while creating category:', error);
    return res.status(500).json({ status: 'Unsuccessful', message: 'Server error while creating sub-category' });
  } finally {
    await queryRunner.release();
  }
};
