import { PersonalDetails } from "@/api/entity/profile/personal/PersonalDetails";
import { AppDataSource } from "@/server";
import parsePhoneNumberFromString from "libphonenumber-js";
import axios, { AxiosRequestConfig } from 'axios';
import { PersonalDetailsCustomer } from "@/api/entity/profile/personal/PersonalDetailsCustomer";
import { BusinessDetails } from "@/api/entity/profile/business/BusinessDetails";

class SMSService {
    static async sendSMS(providerTemplateId: string, recipientId: string, recipientType: string, data: { [key: string]: any }): Promise<any> {
        const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
        const businessDetailsRepository = AppDataSource.getRepository(BusinessDetails);
        const personalDetailsCustomerRepository = AppDataSource.getRepository(PersonalDetailsCustomer);

        if (!recipientId) {
            throw new Error('Recipient ID is required.');
        }

        let details;
        if (recipientType === 'ServiceProvider') {
            details = await personalDetailsRepository.findOne({ where: { userId: recipientId } });
            if (!details) {
                details = await businessDetailsRepository.findOne({ where: { userId: recipientId } });
            }
        }
        else {
            details = await personalDetailsCustomerRepository.findOne({ where: { userId: recipientId } });
        }

        if (!details) {
            throw new Error(`No personal details found for userId: ${recipientId}`);
        }

        const phoneNumber = parsePhoneNumberFromString(details?.mobileNumber, 'IN'); // 'IN' stands for India

        if (!phoneNumber || !phoneNumber.isValid()) {
            throw new Error(`Invalid mobile number: ${details?.mobileNumber}`);
        }

        const formattedMobileNumber = phoneNumber.format('E.164');

        const options: AxiosRequestConfig = {
            method: 'POST',
            url: 'https://control.msg91.com/api/v5/flow',
            headers: {
                authkey: process.env.MSG91_AUTH_KEY as string,
                accept: 'application/json',
                'content-type': 'application/json',
            },
            data: JSON.stringify({
                template_id: providerTemplateId,
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
            return data;
        } catch (error: any) {
            console.error('Error:', error?.message || 'Unknown error occurred during SMS request');
            throw error;
        }
    }
}

export default SMSService;
