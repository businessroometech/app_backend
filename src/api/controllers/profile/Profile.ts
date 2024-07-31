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

export const setPersonalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sectorId,
            userLoginId,
            mobileNumber,
            profilePicture,
            fullName,
            dob,
            emailAddress,
            bio,
            permanentAddress,
            currentAddress,
            aadharNumber,
            panNumber,
        } = req.body;

        let details: PersonalDetails | null = await PersonalDetails.findOne({ where: { sectorId, userLoginId } });

        if (!details) {
            details = await PersonalDetails.create({
                mobileNumber,
                sectorId,
                userLoginId,
                profilePicture,
                fullName,
                dob,
                emailAddress,
                bio,
                permanentAddress,
                currentAddress,
                aadharNumber,
                panNumber,
            }).save();
        } else {
            await PersonalDetails.update(
                { mobileNumber, sectorId, userLoginId },
                {
                    profilePicture,
                    fullName,
                    dob,
                    emailAddress,
                    bio,
                    permanentAddress,
                    currentAddress,
                    aadharNumber,
                    panNumber,
                }
            );
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
        console.error('Error during filling personal details :', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
};

export const setProfessionalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            sectorId,
            userLoginId,
            mobileNumber,
            workType,
            alternateWorks,
            portfolioDocument,
            exp,
            comments,
            preferredWorkType,
            preferredLocation,
        } = req.body;


        let details: ProfessionalDetails | null = await ProfessionalDetails.findOne({
            where: { sectorId, userLoginId },
        });

        if (!details) {
            details = await ProfessionalDetails.create({
                mobileNumber,
                sectorId,
                userLoginId,
                workType,
                alternateWorks,
                portfolioDocument,
                totalYearsExperience: exp,
                anyComments: comments,
                preferredWorkType,
                preferredLocation,
            }).save();
        } else {
            await ProfessionalDetails.update(
                {
                    mobileNumber,
                    sectorId,
                    userLoginId,
                },
                {
                    workType,
                    alternateWorks,
                    portfolioDocument,
                    totalYearsExperience: exp,
                    anyComments: comments,
                    preferredWorkType,
                    preferredLocation,
                }
            );
        }

        res.status(200).json({
            status: 'success',
            message: 'Professional details completed',
            data: {
                professionalDetails: details,
            },
        });

    } catch (error) {
        console.error('Error during fillling professional details :', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
};

export const setEducationalDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sectortype } = req.params;
        const { sectorId, mobileNumber, userLoginId } = req.body;

        if (sectortype === 'healthcare') {
            let educationalDetails;
            const {
                collegeName,
                degree,
                yearOfCompletion,
                achievements,
                overallPercentage,
                clinicalSkills,
                awards,
                internships,
                certifications,
            } = req.body;

            let details = await EducationalDetailsHealthcare.findOne({ where: { userLoginId } });

            if (details) {
                await EducationalDetailsHealthcare.update(
                    {
                        mobileNumber,
                        userLoginId,
                    },
                    {
                        collegeName,
                        degree,
                        yearOfCompletion,
                        achievements,
                        overallPercentage,
                        clinicalSkills,
                    }
                );

                // Removing previous awards, certifications, and internships
                await Award.delete({ educationalDetailsHealthcareId: details.id });
                await Certification.delete({ educationalDetailsHealthcareId: details.id });
                await Internship.delete({ educationalDetailsHealthcareId: details.id });

                // Add new awards
                const awardsCreated = [];
                for (let i = 0; i < awards.length; i++) {
                    const award = await Award.create({
                        educationalDetailsHealthcareId: details.id,
                        userLoginId,
                        awardName: awards[i].name,
                        yearAwarded: awards[i].year,
                        fieldOfAward: awards[i].field,
                    }).save();
                    awardsCreated.push(award);
                }

                // Add new certifications
                const certificationCreated = [];
                for (let i = 0; i < certifications.length; i++) {
                    const certificate = await Certification.create({
                        educationalDetailsHealthcareId: details.id,
                        userLoginId,
                        nameOfCertificate: certifications[i].name,
                        domain: certifications[i].domain,
                        year: certifications[i].year,
                    }).save();
                    certificationCreated.push(certificate);
                }

                // Add new internships
                const internshipCreated = [];
                for (let i = 0; i < internships.length; i++) {
                    const internship = await Internship.create({
                        educationalDetailsHealthcareId: details.id,
                        userLoginId,
                        designation: internships[i].designation,
                        companyName: internships[i].companyName,
                        yearOfExperience: internships[i].yearOfExperience,
                    }).save();
                    internshipCreated.push(internship);
                }

                educationalDetails = { details, awards: awardsCreated, internships: internshipCreated, certifications: certificationCreated };
            }
            else {
                details = await EducationalDetailsHealthcare.create({
                    mobileNumber,
                    userLoginId,
                    collegeName,
                    degree,
                    yearOfCompletion,
                    achievements,
                    overallPercentage,
                    clinicalSkills,
                }).save();

                const educationalDetailsHealthcareId = details.id;

                const awardsCreated = [];
                for (let i = 0; i < awards.length; i++) {
                    const award = await Award.create({
                        educationalDetailsHealthcareId,
                        userLoginId,
                        awardName: awards[i].name,
                        yearAwarded: awards[i].year,
                        fieldOfAward: awards[i].field,
                    }).save();

                    awardsCreated.push(award);
                }

                const certificationCreated = [];
                for (let i = 0; i < certifications.length; i++) {
                    const certificate = await Certification.create({
                        educationalDetailsHealthcareId,
                        userLoginId,
                        nameOfCertificate: certifications[i].name,
                        domain: certifications[i].domain,
                        year: certifications[i].year,
                    }).save();

                    certificationCreated.push(certificate);
                }

                const internshipCreated = [];
                for (let i = 0; i < internships.length; i++) {
                    const internship = await Internship.create({
                        educationalDetailsHealthcareId,
                        userLoginId,
                        designation: internships[i].designation,
                        companyName: internships[i].companyName,
                        yearOfExperience: internships[i].yearOfExperience,
                    }).save();

                    internshipCreated.push(internship);
                }

                educationalDetails = { details, awards: awardsCreated, internships: internshipCreated, certifications: certificationCreated };
            }

            res.status(201).json({
                status: 'success',
                message: 'Educational detials completed',
                data: {
                    educationalDetails,
                },
            });

        } else if (sectortype === 'petcare') {
            const {
                yearsOfExperience,
                typeOfExperience,
                certificationsAndLicenses,
                insurance,
                workingDays,
                workingHours,
                comfortablePets,
                breedExperience,
                petSize,
                ratesForServices,
                serviceArea,
                previousWork,
                documents,
                introductionVideo,
            } = req.body;

            let details: EducationalDetailsPetcare | null = await EducationalDetailsPetcare.findOne({ where: { userLoginId } });

            if (details) {
                await EducationalDetailsPetcare.update(
                    { mobileNumber, userLoginId },
                    {
                        yearsOfExperience,
                        typeOfExperience,
                        certificateAndLicence: certificationsAndLicenses,
                        insurance,
                        workingDays,
                        workingHours,
                        petsYouAreComfortableWith: comfortablePets,
                        breedExperience,
                        petSize,
                        ratesOfEachService: ratesForServices,
                        serviceArea,
                        previousWork,
                        anyDocuments: documents,
                        shortIntroVideo: introductionVideo,
                    }
                );
            } else {
                details = await EducationalDetailsPetcare.create({
                    mobileNumber,
                    userLoginId,
                    yearsOfExperience,
                    typeOfExperience,
                    certificateAndLicence: certificationsAndLicenses,
                    insurance,
                    workingDays,
                    workingHours,
                    petsYouAreComfortableWith: comfortablePets,
                    breedExperience,
                    petSize,
                    ratesOfEachService: ratesForServices,
                    serviceArea,
                    previousWork,
                    anyDocuments: documents,
                    shortIntroVideo: introductionVideo,
                }).save();
            }

            res.status(201).json({
                status: 'success',
                message: 'Educational detials completed',
                data: {
                    educationalDetails: details,
                },
            });
        } else {
            const { collegeName, degree, yearOfCompletion, otherCertifications, achievements } = req.body;

            let details: EducationalDetails | null = await EducationalDetails.findOne({ where: { sectorId, userLoginId } });

            if (details) {
                await EducationalDetails.update(
                    { mobileNumber, sectorId, userLoginId },
                    {
                        collegeName,
                        degree,
                        yearOfCompletion,
                        otherCertifications,
                        achievements,
                    }
                );
            } else {

                details = await EducationalDetails.create({
                    mobileNumber,
                    sectorId,
                    userLoginId,
                    collegeName,
                    degree,
                    yearOfCompletion,
                    otherCertifications,
                    achievements,
                }).save();
            }

            res.status(201).json({
                status: 'success',
                message: 'Educational detials completed',
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
            userLoginId,
            mobileNumber,
            bankName,
            ifscCode,
            upiIds,
            cancelledCheques,
        } = req.body;

        let details: FinancialDetails | null = await FinancialDetails.findOne({ where: { sectorId, userLoginId } });

        if (!details) {
            details = await FinancialDetails.create({
                mobileNumber,
                sectorId,
                userLoginId,
                bankName,
                ifscCode,
                upiIds,
                cancelledCheques,
            }).save();
        } else {
            await FinancialDetails.update(
                { mobileNumber, sectorId, userLoginId },
                {
                    bankName,
                    ifscCode,
                    upiIds,
                    cancelledCheques,
                }
            );
        }

        res.status(200).json({
            status: 'success',
            message: 'Financial details completed',
            data: {
                financialDetails: details,
            },
        });

    } catch (error: any) {
        if (error.code == 'ER_DUP_ENTRY') {
            res.status(500).json({ status: 'error', message: 'Duplicate Entry of field' });
            return;
        }
        console.error('Error during filling financial details :', error);
        res.status(500).json({ status: 'error', message: 'Something went wrong! please try again later.' });
    }
};