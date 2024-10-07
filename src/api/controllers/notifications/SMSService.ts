import { PersonalDetails } from "@/api/entity/profile/personal/PersonalDetails";
import { AppDataSource } from "@/server";
import parsePhoneNumberFromString from "libphonenumber-js";
import axios, { AxiosRequestConfig } from 'axios';

class SMSService {
    static async sendSMS(providerTemplateId: string, recipientId: string, data: { [key: string]: any }): Promise<any> {
        const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);

        // Ensure recipientId is valid
        if (!recipientId) {
            throw new Error('Recipient ID is required.');
        }

        const personalDetails = await personalDetailsRepository.findOne({ where: { userId: recipientId } });

        if (!personalDetails) {
            throw new Error(`No personal details found for userId: ${recipientId}`);
        }

        const phoneNumber = parsePhoneNumberFromString(personalDetails?.mobileNumber, 'IN'); // 'IN' stands for India

        if (!phoneNumber || !phoneNumber.isValid()) {
            throw new Error(`Invalid mobile number: ${personalDetails?.mobileNumber}`);
        }

        const formattedMobileNumber = phoneNumber.format('E.164');

        const options: AxiosRequestConfig = {
            method: 'POST',
            url: 'https://control.msg91.com/api/v5/flow',
            headers: {
                authkey: process.env.MSG91_AUTH_KEY as string, // Use environment variables for sensitive data
                accept: 'application/json',
                'content-type': 'application/json',
            },
            data: JSON.stringify({
                template_id: providerTemplateId, // Your template ID
                recipients: [
                    {
                        mobiles: formattedMobileNumber, 
                        ...data
                    }
                ]
            })
        };

        try {
            const { data } = await axios.request(options);
            return data; // Return the response
        } catch (error: any) {
            console.error('Error:', error?.message || 'Unknown error occurred during SMS request');
            throw error;
        }
    }
}

export default SMSService;
