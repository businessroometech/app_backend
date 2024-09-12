import { Request, Response } from 'express';

import { Award } from '../../entity/profile/educational/healthcare/Award';
import { Certification } from '../../entity/profile/educational/healthcare/Certification';
import { EducationalDetails } from '../../entity/profile/educational/other/EducationalDetails';
import { EducationalDetailsHealthcare } from '../../entity/profile/educational/healthcare/EducationalDetailsHealthcare';
import { EducationalDetailsPetcare } from '../../entity/profile/educational/petcare/EducationalDetailsPetcare';
import { Internship } from '../../entity/profile/educational/healthcare/Internship';
import { PersonalDetails } from '../../entity/profile/personal/PersonalDetails';
import { ProfessionalDetails } from '../../entity/profile/professional/ProfessionalDetails';
import { FinancialDetails } from '@/api/entity/profile/financial/FinancialDetails';
import { DocumentUpload } from '@/api/entity/profile/DocumentUpload';
import { In } from 'typeorm';
import { PersonalDetailsCustomer } from '@/api/entity/profile/personal/PersonalDetailsCustomer';
import { UserLogin } from '@/api/entity/user/UserLogin';
import { BusinessDetails } from '@/api/entity/profile/business/BusinessDetails';
import { AppDataSource } from '@/server';

export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body;

        const userLoginRepository = AppDataSource.getRepository(UserLogin);

        if (!userId) {
            res.status(400).json({ status: "error", message: "Please provide userId" });
            return;
        }

        const user = await userLoginRepository.findOne({ where: { id: userId } });

        res.status(200).json({ status: "success", message: "Successfully found user", data: { user } });

    } catch (error) {
        console.error('Error finding user using userId :', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
}

export const setPersonalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sectorId,
            userId,
            mobileNumber,
            profilePictureId,
            fullName,
            dob,
            emailAddress,
            bio,
            permanentAddress,
            currentAddress,
            aadharNumberId,
            panNumberId,
            createdBy,
            updatedBy,
        } = req.body;

        const userLoginRepository = AppDataSource.getRepository(UserLogin);
        const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
        const documentUploadRepository = AppDataSource.getRepository(DocumentUpload);

        // Ensure DocumentUpload entries for profile picture, Aadhar, and PAN numbers
        const profilePictureUpload = await documentUploadRepository.findOne({ where: { id: profilePictureId } });
        const aadharNumberUpload = await documentUploadRepository.findOne({ where: { id: aadharNumberId } });
        const panNumberUpload = await documentUploadRepository.findOne({ where: { id: panNumberId } });

        if (!profilePictureUpload || !aadharNumberUpload || !panNumberUpload) {
            res.status(400).json({ status: 'error', message: 'Invalid document upload IDs' });
            return;
        }

        let details = await personalDetailsRepository.findOne({ where: { sectorId, userId } });

        if (!details) {
            details = personalDetailsRepository.create({
                sectorId,
                userId,
                mobileNumber,
                profilePictureUploadId: profilePictureUpload.id,
                fullName,
                dob,
                emailAddress,
                bio,
                permanentAddress,
                currentAddress,
                aadharNumberUploadId: aadharNumberUpload.id,
                panNumberUploadId: panNumberId,
                createdBy: createdBy || 'system',
                updatedBy: updatedBy || 'system',
            });
            await details.save();
        } else {
            await personalDetailsRepository.update(
                { sectorId, userId },
                {
                    mobileNumber,
                    profilePictureUploadId: profilePictureUpload.id,
                    fullName,
                    dob,
                    emailAddress,
                    bio,
                    permanentAddress,
                    currentAddress,
                    aadharNumberUploadId: aadharNumberUpload.id,
                    panNumberUploadId: panNumberUpload.id,
                    updatedBy: updatedBy || 'system',
                }
            );
            details = await personalDetailsRepository.findOne({ where: { sectorId, userId } });
        }

        res.status(200).json({
            status: 'success',
            message: 'Personal details completed',
            data: {
                personalDetails: details,
            },
        });
    } catch (error: any) {
        if (error.code == 'ER_DUP_ENTRY') {
            res.status(500).json({ status: 'error', message: 'Duplicate Entry of field' });
            return;
        }
        console.error('Error during filling personal details:', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
};

export const setProfessionalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sectorId,
            userId,
            portfolioDocumentIds,
            exp,
            comments,
            preferredWorkType,
            preferredLocation,
            createdBy,
            updatedBy,
        } = req.body;

        const professionalDetailsRepository = AppDataSource.getRepository(ProfessionalDetails);
        const documentUploadRepository = AppDataSource.getRepository(DocumentUpload);


        const portfolioUploads = await documentUploadRepository.find({
            where: { id: In(portfolioDocumentIds) }
        });

        if (portfolioUploads.length !== portfolioDocumentIds.length) {
            res.status(400).json({ status: 'error', message: 'Invalid portfolio document IDs' });
            return;
        }

        let details: ProfessionalDetails | null = await professionalDetailsRepository.findOne({
            where: { sectorId, userId },
        });

        if (!details) {
            details = professionalDetailsRepository.create({
                sectorId,
                userId,
                portfolioDocumentUploadIds: portfolioDocumentIds,
                totalYearsExperience: exp,
                comments,
                preferredWorkType,
                preferredLocation,
                createdBy: createdBy || 'system',
                updatedBy: updatedBy || 'system',
            });
            await details.save();
        } else {
            await professionalDetailsRepository.update(
                { sectorId, userId },
                {
                    portfolioDocumentUploadIds: portfolioDocumentIds,
                    totalYearsExperience: exp,
                    comments,
                    preferredWorkType,
                    preferredLocation,
                    updatedBy: updatedBy || 'system',
                }
            );
            details = await professionalDetailsRepository.findOne({ where: { sectorId, userId } });
        }

        res.status(200).json({
            status: 'success',
            message: 'Professional details completed',
            data: {
                professionalDetails: details,
            },
        });

    } catch (error: any) {
        console.error('Error during filling professional details:', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
};

export const setEducationalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sectortype } = req.params;
        const { sectorId, userId } = req.body;

        if (sectortype === 'healthcare') {
            // let educationalDetails;
            // const {
            //     collegeName,
            //     degree,
            //     yearOfCompletion,
            //     achievements,
            //     overallPercentage,
            //     clinicalSkills,
            //     awards,
            //     internships,
            //     certifications,
            // } = req.body;

            // let details = await EducationalDetailsHealthcare.findOne({ where: { userLoginId } });

            // if (details) {
            //     await EducationalDetailsHealthcare.update(
            //         {
            //             mobileNumber,
            //             userLoginId,
            //         },
            //         {
            //             collegeName,
            //             degree,
            //             yearOfCompletion,
            //             achievements,
            //             overallPercentage,
            //             clinicalSkills,
            //         }
            //     );

            //     // Removing previous awards, certifications, and internships
            //     await Award.delete({ educationalDetailsHealthcareId: details.id });
            //     await Certification.delete({ educationalDetailsHealthcareId: details.id });
            //     await Internship.delete({ educationalDetailsHealthcareId: details.id });

            //     // Add new awards
            //     const awardsCreated = [];
            //     for (let i = 0; i < awards.length; i++) {
            //         const award = await Award.create({
            //             educationalDetailsHealthcareId: details.id,
            //             userLoginId,
            //             awardName: awards[i].name,
            //             yearAwarded: awards[i].year,
            //             fieldOfAward: awards[i].field,
            //         }).save();
            //         awardsCreated.push(award);
            //     }

            //     // Add new certifications
            //     const certificationCreated = [];
            //     for (let i = 0; i < certifications.length; i++) {
            //         const certificate = await Certification.create({
            //             educationalDetailsHealthcareId: details.id,
            //             userLoginId,
            //             nameOfCertificate: certifications[i].name,
            //             domain: certifications[i].domain,
            //             year: certifications[i].year,
            //         }).save();
            //         certificationCreated.push(certificate);
            //     }

            //     // Add new internships
            //     const internshipCreated = [];
            //     for (let i = 0; i < internships.length; i++) {
            //         const internship = await Internship.create({
            //             educationalDetailsHealthcareId: details.id,
            //             userLoginId,
            //             designation: internships[i].designation,
            //             companyName: internships[i].companyName,
            //             yearOfExperience: internships[i].yearOfExperience,
            //         }).save();
            //         internshipCreated.push(internship);
            //     }

            //     educationalDetails = { details, awards: awardsCreated, internships: internshipCreated, certifications: certificationCreated };
            // }
            // else {
            //     details = await EducationalDetailsHealthcare.create({
            //         mobileNumber,
            //         userLoginId,
            //         collegeName,
            //         degree,
            //         yearOfCompletion,
            //         achievements,
            //         overallPercentage,
            //         clinicalSkills,
            //     }).save();

            //     const educationalDetailsHealthcareId = details.id;

            //     const awardsCreated = [];
            //     for (let i = 0; i < awards.length; i++) {
            //         const award = await Award.create({
            //             educationalDetailsHealthcareId,
            //             userLoginId,
            //             awardName: awards[i].name,
            //             yearAwarded: awards[i].year,
            //             fieldOfAward: awards[i].field,
            //         }).save();

            //         awardsCreated.push(award);
            //     }

            //     const certificationCreated = [];
            //     for (let i = 0; i < certifications.length; i++) {
            //         const certificate = await Certification.create({
            //             educationalDetailsHealthcareId,
            //             userLoginId,
            //             nameOfCertificate: certifications[i].name,
            //             domain: certifications[i].domain,
            //             year: certifications[i].year,
            //         }).save();

            //         certificationCreated.push(certificate);
            //     }

            //     const internshipCreated = [];
            //     for (let i = 0; i < internships.length; i++) {
            //         const internship = await Internship.create({
            //             educationalDetailsHealthcareId,
            //             userLoginId,
            //             designation: internships[i].designation,
            //             companyName: internships[i].companyName,
            //             yearOfExperience: internships[i].yearOfExperience,
            //         }).save();

            //         internshipCreated.push(internship);
            //     }

            //     educationalDetails = { details, awards: awardsCreated, internships: internshipCreated, certifications: certificationCreated };
            // }

            // res.status(201).json({
            //     status: 'success',
            //     message: 'Educational detials completed',
            //     data: {
            //         educationalDetails,
            //     },
            // });

        } else if (sectortype === 'petcare') {
            // const {
            //     yearsOfExperience,
            //     typeOfExperience,
            //     certificationsAndLicenses,
            //     insurance,
            //     workingDays,
            //     workingHours,
            //     comfortablePets,
            //     breedExperience,
            //     petSize,
            //     ratesForServices,
            //     serviceArea,
            //     previousWork,
            //     documents,
            //     introductionVideo,
            // } = req.body;

            // let details: EducationalDetailsPetcare | null = await EducationalDetailsPetcare.findOne({ where: { userLoginId } });

            // if (details) {
            //     await EducationalDetailsPetcare.update(
            //         { mobileNumber, userLoginId },
            //         {
            //             yearsOfExperience,
            //             typeOfExperience,
            //             certificateAndLicence: certificationsAndLicenses,
            //             insurance,
            //             workingDays,
            //             workingHours,
            //             petsYouAreComfortableWith: comfortablePets,
            //             breedExperience,
            //             petSize,
            //             ratesOfEachService: ratesForServices,
            //             serviceArea,
            //             previousWork,
            //             anyDocuments: documents,
            //             shortIntroVideo: introductionVideo,
            //         }
            //     );
            // } else {
            //     details = await EducationalDetailsPetcare.create({
            //         mobileNumber,
            //         userLoginId,
            //         yearsOfExperience,
            //         typeOfExperience,
            //         certificateAndLicence: certificationsAndLicenses,
            //         insurance,
            //         workingDays,
            //         workingHours,
            //         petsYouAreComfortableWith: comfortablePets,
            //         breedExperience,
            //         petSize,
            //         ratesOfEachService: ratesForServices,
            //         serviceArea,
            //         previousWork,
            //         anyDocuments: documents,
            //         shortIntroVideo: introductionVideo,
            //     }).save();
            // }

            // res.status(201).json({
            //     status: 'success',
            //     message: 'Educational detials completed',
            //     data: {
            //         educationalDetails: details,
            //     },
            // });
        } else {
            const {
                collegeName,
                degree,
                yearOfCompletion,
                otherCertifications,
                achievements,
                createdBy,
                updatedBy,
            } = req.body;

            const educationalDetailsRepository = AppDataSource.getRepository(EducationalDetails);


            let details: EducationalDetails | null = await EducationalDetails.findOne({
                where: { sectorId, userId },
            });

            if (details) {
                await educationalDetailsRepository.update(
                    { sectorId, userId },
                    {
                        collegeName,
                        degree,
                        yearOfCompletion,
                        otherCertifications,
                        achievements,
                        updatedBy: updatedBy || 'system',
                    }
                );

                details = await educationalDetailsRepository.findOne({
                    where: { sectorId, userId },
                });
            } else {
                details = await educationalDetailsRepository.create({
                    sectorId,
                    userId,
                    collegeName,
                    degree,
                    yearOfCompletion,
                    otherCertifications,
                    achievements,
                    createdBy: createdBy || 'system',
                    updatedBy: updatedBy || 'system',
                }).save();
            }

            res.status(201).json({
                status: 'success',
                message: 'Educational details completed',
                data: {
                    educationalDetails: details,
                },
            });
        }
    } catch (error) {
        console.error('Error during filling educational details :', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
}

export const setFinancialDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sectorId,
            userId,
            bankName,
            accountHolder,
            accountNumber,
            ifscCode,
            upiIds,
            cancelledChequesIds,
            createdBy,
            updatedBy,
        } = req.body;

        const financialDetailsRepository = AppDataSource.getRepository(FinancialDetails);


        let details: FinancialDetails | null = await financialDetailsRepository.findOne({
            where: { sectorId, userId },
        });

        if (!details) {
            details = await financialDetailsRepository.create({
                sectorId,
                userId,
                bankName,
                accountHolder,
                accountNumber,
                ifscCode,
                upiIds,
                cancelledChequeUploadIds: cancelledChequesIds,
                createdBy: createdBy || 'system',
                updatedBy: updatedBy || 'system',
            }).save();
        } else {
            await financialDetailsRepository.update(
                { sectorId, userId },
                {
                    bankName,
                    accountHolder,
                    accountNumber,
                    ifscCode,
                    upiIds,
                    cancelledChequeUploadIds: cancelledChequesIds,
                    updatedBy: updatedBy || 'system',
                }
            );
            details = await financialDetailsRepository.findOne({
                where: { sectorId, userId },
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Financial details completed',
            data: {
                financialDetails: details,
            },
        });

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(500).json({ status: 'error', message: 'Duplicate entry for a field' });
            return;
        }
        console.error('Error during filling financial details:', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! Please try again later.' });
    }
};

export const createOrUpdateBusinessDetails = async (req: Request, res: Response) => {
    const {
        userId,
        sectorId,
        profilePictureUploadId,
        companyName,
        companyType,
        emailAddress,
        gstInNumber,
        mobileNumber,
        companyPancard,
        bio,
        permanentAddress,
        currentAddress,
        registrationCertificateUploadId,
        panNumberUploadId,
        createdBy,
        updatedBy,
    } = req.body;

    const businessDetailsRepository = AppDataSource.getRepository(BusinessDetails);


    try {
        // Check if a record with the provided userId and sectorId exists
        let businessDetails = await businessDetailsRepository.findOne({
            where: { userId, sectorId },
        });

        if (businessDetails) {
            // Update existing record
            businessDetails.profilePictureUploadId = profilePictureUploadId ?? businessDetails.profilePictureUploadId;
            businessDetails.companyName = companyName ?? businessDetails.companyName;
            businessDetails.companyType = companyType ?? businessDetails.companyType;
            businessDetails.emailAddress = emailAddress ?? businessDetails.emailAddress;
            businessDetails.gstInNumber = gstInNumber ?? businessDetails.gstInNumber;
            businessDetails.mobileNumber = mobileNumber ?? businessDetails.mobileNumber;
            businessDetails.companyPancard = companyPancard ?? businessDetails.companyPancard;
            businessDetails.bio = bio ?? businessDetails.bio;
            businessDetails.permanentAddress = permanentAddress ?? businessDetails.permanentAddress;
            businessDetails.currentAddress = currentAddress ?? businessDetails.currentAddress;
            businessDetails.registrationCertificateUploadId = registrationCertificateUploadId ?? businessDetails.registrationCertificateUploadId;
            businessDetails.panNumberUploadId = panNumberUploadId ?? businessDetails.panNumberUploadId;
            businessDetails.updatedBy = updatedBy ?? businessDetails.updatedBy;

            await businessDetails.save();

        } else {
            // Create new record
            businessDetails = businessDetailsRepository.create({
                userId,
                sectorId,
                profilePictureUploadId,
                companyName,
                companyType,
                emailAddress,
                gstInNumber,
                mobileNumber,
                companyPancard,
                bio,
                permanentAddress,
                currentAddress,
                registrationCertificateUploadId,
                panNumberUploadId,
                createdBy: createdBy ?? 'system',
            });

            await businessDetails.save();
        }

        res.status(200).json(businessDetails);
    } catch (error) {
        console.error('Error creating/updating BusinessDetails:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getPersonalDetails = async (req: Request, res: Response) => {

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);

    try {
        const { userId, sectorId } = req.body;
        const details = await personalDetailsRepository.findOne({ where: { userId, sectorId } });
        res.status(200).json({
            status: 'success',
            message: `Personal details fetched for user with id: ${userId}`,
            data: {
                personalDetails: details,
            },
        });
    } catch (error) {
        console.error('Error fetching personal details :', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch personal details' });
    }
};

export const getProfessionalDetails = async (req: Request, res: Response) => {

    const professionalDetailsRepository = AppDataSource.getRepository(ProfessionalDetails);

    try {
        const { userId, sectorId } = req.body;
        const details = await professionalDetailsRepository.findOne({ where: { userId, sectorId } });
        res.status(200).json({
            status: 'success',
            message: `Professional details fetched for user with id: ${userId}`,
            data: {
                professionalDetails: details,
            },
        });
    } catch (error) {
        console.error('Error fetching professional details :', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch professional details' });
    }
};

export const getEducationalDetails = async (req: Request, res: Response) => {
    try {
        const { sectortype } = req.params;
        const { userId, sectorId } = req.body;
        if (sectortype === 'healthcare') {

        }
        else if (sectortype === 'petcare') {

        }
        else {

            const educationalDetailsRepository = AppDataSource.getRepository(EducationalDetails);

            const details = await educationalDetailsRepository.findOne({ where: { userId, sectorId } });
            res.status(200).json({
                status: 'success',
                message: `Educational details fetched for user with id: ${userId}`,
                data: {
                    educationalDetails: details,
                },
            });
        }
    } catch (error) {
        console.error('Error fetching educational details :', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch educational details' });
    }
};

export const getFinancialDetails = async (req: Request, res: Response) => {
    try {

        const financialDetailsRepository = AppDataSource.getRepository(FinancialDetails);

        const { userId, sectorId } = req.body;
        const details = await financialDetailsRepository.findOne({ where: { userId, sectorId } });
        res.status(200).json({
            status: 'success',
            message: `Financial details fetched for user with id: ${userId}`,
            data: {
                financialDetails: details,
            },
        });
    } catch (error) {
        console.error('Error fetching financial details :', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch financial details' });
    }
};

export const getBusinessDetails = async (req: Request, res: Response) => {
    try {

        const businessDetailsRepository = AppDataSource.getRepository(BusinessDetails);

        const { userId, sectorId } = req.body;
        const details = await businessDetailsRepository.findOne({ where: { userId, sectorId } });
        res.status(200).json({
            status: 'success',
            message: `Business details fetched for user with id: ${userId}`,
            data: {
                businessDetails: details,
            },
        });
    } catch (error) {
        console.error('Error fetching Business details :', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch Business details' });
    }
};

// ------------------------------------FOR MOBILE APP----------------------------------------------------

export const setPersonalDetailsCustomer = async (req: Request, res: Response) => {
    try {
        const { userId, fullName, emailAddress, mobileNumber, createdBy, updatedBy } = req.body;

        const personalDetailsCustomerRepository = AppDataSource.getRepository(PersonalDetailsCustomer);

        let details = await personalDetailsCustomerRepository.findOne({ where: { userId } });
        let statusCode = 201;
        if (!details) {
            details = await personalDetailsCustomerRepository.create({
                userId,
                fullName,
                emailAddress,
                mobileNumber,
                createdBy: createdBy || 'system',
                updatedBy: updatedBy || 'system',
            }).save();
        }
        else {
            if (fullName) details.fullName = fullName;
            if (emailAddress) details.emailAddress = emailAddress;
            details.updatedBy = updatedBy || 'system';
            await details.save();
            statusCode = 200;
        }
        res.status(statusCode).json({ status: "success", message: "Personal details created/updated successfully", data: { details } });
    } catch (error) {
        console.log("Server Error :", error);
        res.status(500).json({ status: "error", message: "Error creating/updating Personal details" });
    }
}

export const getPersonalDetailsCustomer = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        const personalDetailsCustomerRepository = AppDataSource.getRepository(PersonalDetailsCustomer);

        if (!userId) {
            res.status(400).json({ status: "error", message: "UserId is required" });
        }

        let details = await personalDetailsCustomerRepository.findOne({ where: { userId } });

        res.status(200).json({ status: "success", message: "User Personal details found successfully", data: { details } });
    } catch (error) {
        console.log("Server Error :", error);
        res.status(500).json({ status: "error", message: "Error finding user Personal details" });
    }
}