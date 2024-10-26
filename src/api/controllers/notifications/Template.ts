import { Request, Response } from 'express';
import { Template } from '@/api/entity/notifications/Template';
import { AppDataSource } from '@/server';

export const createTemplates = async (req: Request, res: Response): Promise<Response> => {
    try {
        const templateRepository = AppDataSource.getRepository(Template);

        const templates = req.body.templates;

        if (!Array.isArray(templates) || templates.length === 0) {
            return res.status(400).json({
                status: "error",
                message: 'Templates array is required and cannot be empty',
            });
        }

        const newTemplates = templates.map(templateData => {
            const {
                templateAppTitle,
                templatePhoneTitle,
                templateAppContent,
                templatePhoneContent,
                templateName,
                providerTemplateId,
                createdBy,
                updatedBy
            } = templateData;

            // Create a new template entity
            const template = new Template();
            template.templateAppTitle = templateAppTitle;
            template.templatePhoneTitle = templatePhoneTitle;
            template.templateAppContent = templateAppContent;
            template.templatePhoneContent = templatePhoneContent;
            template.templateName = templateName;
            template.providerTemplateId = providerTemplateId || '';
            template.createdBy = createdBy || 'system';
            template.updatedBy = updatedBy || 'system';

            return template;
        });

        // Save all templates to the database
        await templateRepository.save(newTemplates);

        // Return success response
        return res.status(201).json({
            status: "success",
            message: `${newTemplates.length} templates created successfully`,
            data: {
                templates: newTemplates
            }
        });
    } catch (error) {
        console.error('Error creating templates:', error);
        return res.status(500).json({
            status: "error",
            message: 'Error creating templates',
        });
    }
};
