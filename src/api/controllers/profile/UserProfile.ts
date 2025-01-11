import { Request, Response } from "express";
import { PersonalDetails } from "@/api/entity/personal/PersonalDetails";
import { AppDataSource } from "@/server";
import { generatePresignedUrl } from "../s3/awsControllers";

export const UpdateUserProfile = async (req: Request, res: Response) => {
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

    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({
        message: "User ID is invalid or does not exist.",
      });
    }

    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    let personalDetails = await personalDetailsRepository.findOneBy({ id: userId });

    if (personalDetails) {
      // Only update fields that are provided in the request body, excluding the password
      if (occupation !== undefined) personalDetails.occupation = occupation;
      if (profilePictureUploadId !== undefined) personalDetails.profilePictureUploadId = profilePictureUploadId;
      if (bgPictureUploadId !== undefined) personalDetails.bgPictureUploadId = bgPictureUploadId;
      if (firstName !== undefined) personalDetails.firstName = firstName;
      if (lastName !== undefined) personalDetails.lastName = lastName;
      if (dob !== undefined) personalDetails.dob = dob;
      if (mobileNumber !== undefined) personalDetails.mobileNumber = mobileNumber;
      if (emailAddress !== undefined) personalDetails.emailAddress = emailAddress;
      if (bio !== undefined) personalDetails.bio = bio;
      if (gender !== undefined) personalDetails.gender = gender;
      if (preferredLanguage !== undefined) personalDetails.preferredLanguage = preferredLanguage;
      if (socialMediaProfile !== undefined) personalDetails.socialMediaProfile = socialMediaProfile;
      if (height !== undefined) personalDetails.height = height;
      if (weight !== undefined) personalDetails.weight = weight;
      if (bodyMeasurement !== undefined) personalDetails.bodyMeasurement = bodyMeasurement;
      if (permanentAddress !== undefined) personalDetails.permanentAddress = permanentAddress;
      if (currentAddress !== undefined) personalDetails.currentAddress = currentAddress;
      if (aadharNumberUploadId !== undefined) personalDetails.aadharNumberUploadId = aadharNumberUploadId;
      if (panNumberUploadId !== undefined) personalDetails.panNumberUploadId = panNumberUploadId;

      personalDetails.updatedBy = "system"; // Update metadata

      await personalDetailsRepository.save(personalDetails);

      return res.status(200).json({
        message: "User profile updated successfully.",
        data: personalDetails,
      });
    }
  } catch (error: any) {
    console.error("Error updating user profile:", error);
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
    const { userId } = req.body;

    // Validate if the user exists
    const userRepository = AppDataSource.getRepository(PersonalDetails);
    const user = await userRepository.findOneBy({ id: userId });

    if (!user) {
      return res.status(400).json({
        message: "User ID is invalid or does not exist.",
      });
    }

    // Check if personal details exist for the user
    const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
    const personalDetails = await personalDetailsRepository.findOneBy({ id:userId });

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