import { Request, Response } from 'express';
import { AppDataSource } from '@/server';
import { UserActivity } from '@/api/entity/UserActivity/UserActivity';

export const postUserActivity = async (req: Request, res: Response): Promise<void> => {

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        await queryRunner.startTransaction();

        const {
            userId,
            activity,
            createdBy = "system",
            updatedBy = "system"
        } = req.body;

        if (!userId || !activity) {
            res.status(400).json({
                status: 'error',
                message: 'enter all the required fields',
            });
            return;
        }

        const activityRepository = queryRunner.manager.getRepository(UserActivity);

        const newActivity = activityRepository.create({
            userId,
            activity,
            createdBy,
            updatedBy,
        });

        const user = await activityRepository.save(newActivity);

        await queryRunner.commitTransaction();

        res.status(201).json({
            status: 'success',
            message: 'User activity posted successfully',
            data: user
        });

        return;

    } catch (error: any) {
        if (queryRunner.isTransactionActive) {
            await queryRunner.rollbackTransaction();
        }
        console.error('Error during posting activity:', error);

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong! Please try again later.',
        });

    } finally {
        await queryRunner.release();
    }

}