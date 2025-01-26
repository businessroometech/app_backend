import { PersonalDetails } from '@/api/entity/personal/PersonalDetails';
import { Request, Response } from 'express';


export const markOnline = async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {

        const user = await PersonalDetails.findOne({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        user.isOnline = true;
        await user.save();

        setTimeout(async () => {
            user.isOnline = false;
            await user.save();
            console.log(`User ${userId} is marked as offline after 70 seconds.`);
        }, 70 * 1000);

        const [onlineUsers, total] = await PersonalDetails.findAndCount({
            where: {
                isOnline: true,
            },
        });

        res.status(200).json({
            status: "success", message: 'User is marked as online.', data: {
                onlineUsers,
                totalOnlineUsers: total
            }
        });
    } catch (error) {
        console.error('Error marking user as online:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
};