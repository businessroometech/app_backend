import { PersonalDetails } from "@/api/entity/profile/personal/PersonalDetails";
import { AppDataSource } from "@/server";
import parsePhoneNumberFromString from "libphonenumber-js";
import axios, { AxiosRequestConfig } from 'axios';
import { PersonalDetailsCustomer } from "@/api/entity/profile/personal/PersonalDetailsCustomer";
import { BusinessDetails } from "@/api/entity/profile/business/BusinessDetails";

class SMSService {
    static async sendSMS(providerTemplateId: string, smsTitle: string, recipientId: string, recipientType: string, recipientNumber: string, data: { [key: string]: any }): Promise<any> {
        const personalDetailsRepository = AppDataSource.getRepository(PersonalDetails);
        const businessDetailsRepository = AppDataSource.getRepository(BusinessDetails);
        const personalDetailsCustomerRepository = AppDataSource.getRepository(PersonalDetailsCustomer);

        if (!recipientId && !recipientNumber) {
            throw new Error('Recipient ID or Recipient Number is required.');
        }

        let details;
        if (recipientId) {
            if (recipientType === 'ServiceProvider') {
                details = await personalDetailsRepository.findOne({ where: { userId: recipientId } });
                if (!details) {
                    details = await businessDetailsRepository.findOne({ where: { userId: recipientId } });
                }
            } else if (recipientType === 'Customer') {
                details = await personalDetailsCustomerRepository.findOne({ where: { userId: recipientId } });
            }
        }

        let options: AxiosRequestConfig;
        let formattedMobileNumber: string | undefined;

        if (!details) {

            const phoneNumber = parsePhoneNumberFromString(recipientNumber, 'IN');
            if (!phoneNumber || !phoneNumber.isValid()) {
                throw new Error(`Invalid mobile number: ${recipientNumber}`);
            }

            formattedMobileNumber = phoneNumber.format('E.164');
        } else {

            const phoneNumber = parsePhoneNumberFromString(details.mobileNumber, 'IN');
            if (!phoneNumber || !phoneNumber.isValid()) {
                throw new Error(`Invalid mobile number: ${details.mobileNumber}`);
            }

            formattedMobileNumber = phoneNumber.format('E.164');
        }

        options = {
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
                        title: smsTitle,
                        ...data
                    }
                ]
            })
        };

        try {
            // console.log('SMS Data before provider initiate options', options);
            // const { data } = await axios.request(options);
            // console.log('SMS Data setn to user ', data);
            return data;
        } catch (error: any) {
            console.error('SMS Error:', error?.message || 'Unknown error occurred during SMS request');
            throw error;
        }
    }
}

export default SMSService;
