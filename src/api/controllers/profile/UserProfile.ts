import { Request, Response } from "express";
import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { UserLogin } from "@/api/entity/user/UserLogin";
import { AppDataSource } from "@/server";
import { generatePresignedUrl } from "../s3/awsControllers";

export const createOrUpdateUserProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      occupation,
      userId,
      profilePictureUploadId,
      bgPictureUploadId,
      firstName,
      lastName,
      dob,
      mobileNumber,
      emailAddress,
      bio,
      gender,
      preferredLanguage,
      socialMediaProfile,
      height,
      weight,
      bodyMeasurement,
      permanentAddress,
      currentAddress,
      aadharNumberUploadId,
      panNumberUploadId,
    } = req.body;

    // Validate if the user exists
    const userRepository = AppDataSource.getRepository(UserLogin);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({
        message: "User ID is invalid or does not exist.",
      });
    }

    // Check if personal details already exist for the user
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    let personalDetails = await personalDetailsRepository.findOneBy({ userId });

    if (personalDetails) {
      // Update existing personal details
      Object.assign(personalDetails, {
        occupation,
        profilePictureUploadId,
        bgPictureUploadId,
        firstName,
        lastName,
        dob,
        mobileNumber,
        emailAddress,
        bio,
        gender,
        preferredLanguage,
        socialMediaProfile,
        height,
        weight,
        bodyMeasurement,
        permanentAddress,
        currentAddress,
        aadharNumberUploadId,
        panNumberUploadId,
        updatedBy: "system", // Or fetch this value dynamically if required
      });

      await personalDetailsRepository.save(personalDetails);

      return res.status(200).json({
        message: "User profile updated successfully.",
        data: personalDetails,
      });
    }

    // Create new personal details if none exist
    const newPersonalDetails = personalDetailsRepository.create({
      occupation,
      userId,
      profilePictureUploadId,
      bgPictureUploadId,
      firstName,
      lastName,
      dob,
      mobileNumber,
      emailAddress,
      bio,
      gender,
      preferredLanguage,
      socialMediaProfile,
      height,
      weight,
      bodyMeasurement,
      permanentAddress,
      currentAddress,
      aadharNumberUploadId,
      panNumberUploadId,
      createdBy: "system", // Or fetch this value dynamically if required
    });

    await personalDetailsRepository.save(newPersonalDetails);

    return res.status(201).json({
      message: "User profile created successfully.",
      data: newPersonalDetails,
    });
  } catch (error: any) {
    console.error("Error creating/updating user profile:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// get user profile 
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;

    // Validate if the user exists
    const userRepository = AppDataSource.getRepository(UserLogin);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({
        message: "User ID is invalid or does not exist.",
      });
    }

    // Check if personal details exist for the user
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const personalDetails = await personalDetailsRepository.findOneBy({ userId });

    if (!personalDetails) {
      return res.status(404).json({
        message: "User profile not found.",
      });
    }

    const profileimgurl = await generatePresignedUrl(personalDetails?.profilePictureUploadId);
    const coverimurl= await generatePresignedUrl(personalDetails?.bgPictureUploadId);

    return res.status(200).json({
      message: "User profile fetched successfully.",
      data: {personalDetails, profileimgurl, coverimurl},
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};