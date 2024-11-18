import { EventDraft } from '@/api/entity/eventManagement/EventDraft';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateRequestBody } from '@/common/utils/requestBodyValidation';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

// CREATING
// export const postCreatedEventDraft = async (req: Request, res: Response) => {
//   try {
//   } catch (error) {
//     console.error('Error creating invoice:', error);
//     return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
//   }
// };

export const getAllCreatedDraft = async (req: Request, res: Response) => {
  const validationRules = {
    userId: { required: false, type: 'string' },
  };
  // Request validation start
  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const draftRepository = AppDataSource.getRepository(EventDraft);

  const { userId } = req.body;

  try {
    const drafts = await draftRepository.find({ where: { userId } });
    if (!drafts || drafts.length === 0)
      return res.status(204).json({ status: 'success', message: 'Drafts is empty', data: drafts });

    return res.status(200).json({ status: 'success', message: 'Drafts fetched successfully', data: drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return res.status(500).json({ status: 'error', message: 'Error fetching drafts' });
  }
};

export const getDraftDetails = async (req: Request, res: Response) => {
  const validationRules = {
    userId: { required: false, type: 'string' },
    id: { required: false, type: 'string' },
  };

  const errors = validateRequestBody(req.body, validationRules);
  if (errors) {
    return res.status(400).json({ errors });
  }

  const draftRepository = AppDataSource.getRepository(EventDraft);

  const { id, userId } = req.body;

  if (userId) return res.status(500).json({ status: 'error', message: 'User Id is not defined' });

  try {
    const drafts = await draftRepository.find({ where: { id } });
    if (!drafts || drafts.length === 0)
      return res.status(204).json({ status: 'error', message: 'No draft found', data: [] });

    return res.status(200).json({ status: 'success', message: 'Drafts fetched successfully', data: drafts });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
