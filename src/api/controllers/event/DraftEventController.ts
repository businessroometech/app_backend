import { EventDraft } from '@/api/entity/eventManagement/EventDraft';
import { Sector } from '@/api/entity/sector/Sector';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { validateAndFetchEntities, ValidationConfig } from '@/components/validateFields';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';

// CREATING
export const postCreatedEventDraft = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};

export const getAllCreatedDraft = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const eventRepository = AppDataSource.getRepository(Event);
  const draftRepository = AppDataSource.getRepository(EventDraft);

  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide eventId' },
  ];
  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  try {
    const drafts = await draftRepository.find();

    return res.status(200).json({ status: 'success', message: 'Drafts fetched successfully', data: drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return res.status(500).json({ status: 'error', message: 'Error fetching drafts' });
  }
};

export const getDraftDetails = async (req: Request, res: Response) => {
  const userLoginRepository = AppDataSource.getRepository(UserLogin);
  const sectorRepository = AppDataSource.getRepository(Sector);
  const eventRepository = AppDataSource.getRepository(Event);
  const draftRepository = AppDataSource.getRepository(EventDraft);

  const validationConfigs: ValidationConfig[] = [
    { field: 'userId', repository: userLoginRepository, errorMessage: 'Please provide userId' },
    { field: 'eventId', repository: eventRepository, errorMessage: 'Please provide eventId' },
    { field: 'sectorId', repository: sectorRepository, errorMessage: 'Please provide sectorId' },
  ];

  const entities = await validateAndFetchEntities(req, res, validationConfigs);
  if (!entities) return;

  const { id } = req.body;
  try {
    const drafts = await draftRepository.find({ where: { id } });

    return res.status(200).json({ status: 'success', message: 'Drafts fetched successfully', data: drafts });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ status: 'error', message: 'Error creating invoice' });
  }
};
