import { Request, Response } from 'express';

import { Award } from '../../entity/Award';
import { Certification } from '../../entity/Certification';
import { EducationalDetails } from '../../entity/EducationalDetails';
import { EducationalDetailsHealthcare } from '../../entity/EducationalDetailsHealthcare';
import { EducationalDetailsPetcare } from '../../entity/EducationalDetailsPetcare';
import { Internship } from '../../entity/Internship';
import { PersonalDetails } from '../../entity/PersonalDetails';
import { ProfessionalDetails } from '../../entity/ProfessionalDetails';
import { UserDetails } from '../../entity/UserDetails';
import { UserLogin } from '../../entity/UserLogin';

export const signup_phase1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, password, sectorId } = req.body;
    console.log(mobileNumber, password, sectorId);

    if (!mobileNumber || !password) {
      res.status(400).json({ status: 'error', message: 'Please provide a mobile number and password.' });
      return;
    }

    const existingUser = await UserLogin.findOne({ where: { mobileNumber } });

    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'Mobile number already registered',
        data: {
          user: existingUser,
        },
      });
      return;
    }

    let statusCode = 200;
    let appliedBefore: UserDetails | null = await UserDetails.findOne({ where: { mobileNumber, sectorId } });

    if (!appliedBefore) {
      statusCode = 201;
      appliedBefore = await UserDetails.create({
        mobileNumber,
        sectorId,
        detailsCompleted: false,
        roleSelectedId: '',
      }).save();
    }

    res.status(statusCode).json({
      status: 'success',
      message: 'signup phase 1 completed',
      data: {
        signupProcessObj: appliedBefore,
      },
    });
  } catch (error) {
    console.error('Error during signup phase 1:', error);
    res.status(500).json({ status: 'error', message: 'Server error during user signup.' });
  }
};

export const signup_phase2 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobileNumber, roleId, sectorId } = req.body;

    const signupProcessObj: UserDetails | null = await UserDetails.findOne({ where: { mobileNumber, sectorId } });
    if (signupProcessObj) {
      signupProcessObj.roleSelectedId = roleId;
      await signupProcessObj.save();

      res.status(200).json({
        status: 'success',
        message: 'User role selected',
        data: {
          signupProcessObj,
        },
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User details not found' });
    }
  } catch (error) {
    console.error('Error during signup phase 2:', error);
    res.status(500).json({ status: 'error', message: 'Server error during user signup.' });
  }
};

export const signup_phase3 = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sectorId,
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

    let details: PersonalDetails | null = await PersonalDetails.findOne({ where: { mobileNumber, sectorId } });

    if (!details) {
      details = await PersonalDetails.create({
        mobileNumber,
        sectorId,
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
        { mobileNumber, sectorId },
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

    // const signupProcessObj = await UserDetails.findOne({ where: { mobileNumber, sectorId } });

    // if (signupProcessObj) {
    //   signupProcessObj.personalDetailsCompleted = true;
    //   await signupProcessObj.save();

    res.status(200).json({
      status: 'success',
      message: 'Personal details completed',
      data: {
        // signupProcessObj,
        personalDetails: details,
      },
    });
    // } else {
    //   res.status(404).json({ status: 'error', message: 'User details not found' });
    // }
  } catch (error) {
    console.error('Error during signup phase 3:', error);
    res.status(500).json({ status: 'error', message: 'Server error during user signup.' });
  }
};

export const signup_phase4 = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      sectorId,
      mobileNumber,
      workType,
      alternateWorks,
      portfolioDocument,
      exp,
      comments,
      preferredWorkType,
      preferredLocation,
    } = req.body;

    // const signupProcessObj = await UserDetails.findOne({ where: { mobileNumber, sectorId } });

    // if (signupProcessObj) {
    //   signupProcessObj.professionalDetailsCompleted = true;
    //   await signupProcessObj.save();

    let details: ProfessionalDetails | null = await ProfessionalDetails.findOne({
      where: { mobileNumber, sectorId },
    });

    if (!details) {
      details = await ProfessionalDetails.create({
        mobileNumber,
        sectorId,
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
        // signupProcessObj,
        professionalDetails: details,
      },
    });
    // } else {
    //   res.status(404).json({ status: 'error', message: 'User details not found' });
    // }
  } catch (error) {
    console.error('Error during signup phase 4:', error);
    res.status(500).json({ status: 'error', message: 'Server error during user signup.' });
  }
};

export const signup_phase5 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectortype } = req.params;
    let details;

    const { password, sectorId, mobileNumber } = req.body;
    if (sectortype === 'healthcare') {
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

      details = await EducationalDetailsHealthcare.create({
        mobileNumber,
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
          awardName: awards[i].name,
          yearAwarded: awards[i].year,
          fieldOfAward: awards[i].field,
        }).save();

        awardsCreated.push(award);
      }
      details = { ...details, awardsCreated };

      const certificationCreated = [];
      for (let i = 0; i < certifications.length; i++) {
        const certificate = await Certification.create({
          educationalDetailsHealthcareId,
          nameOfCertificate: certifications[i].name,
          domain: certifications[i].domain,
          year: certifications[i].year,
        }).save();

        certificationCreated.push(certificate);
      }
      details = { ...details, certificationCreated };

      const internshipCreated = [];
      for (let i = 0; i < internships.length; i++) {
        const internship = await Internship.create({
          educationalDetailsHealthcareId,
          designation: internships[i].designation,
          companyName: internships[i].companyName,
          yearOfExperience: internships[i].yearOfExperience,
        }).save();

        internshipCreated.push(internship);
      }
      details = { ...details, internshipCreated };
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

      details = await EducationalDetailsPetcare.create({
        mobileNumber,
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
    } else {
      const { collegeName, degree, yearOfCompletion, otherCertifications, achievements } = req.body;

      details = await EducationalDetails.create({
        mobileNumber,
        sectorId,
        collegeName,
        degree,
        yearOfCompletion,
        otherCertifications,
        achievements,
      }).save();
    }

    const signupProcessObj: UserDetails | null = await UserDetails.findOne({ where: { mobileNumber, sectorId } });

    if (signupProcessObj) {
      signupProcessObj.detailsCompleted = true;
      await signupProcessObj.save();

      const newUser = await UserLogin.create({
        mobileNumber,
        password,
        sectorAssociated: [sectorId],
      }).save();

      res.status(201).json({
        status: 'success',
        message: 'Educational detials completed. User registered successfully',
        data: {
          educationalDetails: details,
          user: newUser,
        },
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User details not found' });
    }
  } catch (error) {
    console.error('Error during signup phase 5:', error);
    res.status(500).json({ status: 'error', message: 'Server error during user signup.' });
  }
};
