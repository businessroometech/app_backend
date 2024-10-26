import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { Service } from '@/api/entity/sector/Service';

export const getService = async (req: Request, res: Response) => {
  try {
    const { subCategoryId } = req.body;

    const subCategoryRepository = AppDataSource.getRepository(Service);

    const categories = await subCategoryRepository.find({ where: { subCategoryId } });

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

export const postService = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  const { subCategoryId, name, bio } = req.body;

  // Validate request body
  if (!subCategoryId)
    return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Sub-Category ID' });

  if (!name) return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide Name' });

  if (!bio) return res.status(400).json({ status: 'Unsuccessful', message: 'Please provide bio' });

  try {
    const serviceRepository = AppDataSource.getRepository(Service);

    // Create and save the new category
    const newCategory = serviceRepository.create({
      subCategoryId,
      name,
      bio,
    });

    await serviceRepository.save(newCategory);

    return res.status(201).json({ status: 'Successful', message: 'Sub-Category created successfully' });
  } catch (error) {
    console.error('Error while creating category:', error);
    return res.status(500).json({ status: 'Unsuccessful', message: 'Server error while creating sub-category' });
  } finally {
    await queryRunner.release();
  }
};
