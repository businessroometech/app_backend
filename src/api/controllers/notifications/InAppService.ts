class SMSController {
    static async sendInAppSMS(providerTemplateId: string, recipientId: string): Promise<any> {

        try {
            // Validate request body
            if (!providerTemplateId || !recipientId) {
                return res.status(400).json({
                    error: "providerTemplateId and recipientId are required.",
                });
            }

            // Call the SMSService to send SMS
            const result = await SMSService.sendSMS(providerTemplateId, recipientId);

            // Check if the SMS was sent successfully
            if (!result) {
                return res.status(404).json({
                    error: "Failed to send SMS. Recipient not found or invalid details.",
                });
            }

            // Send success response
            return res.status(200).json({
                message: "SMS sent successfully.",
                data: result,
            });
        } catch (error: any) {
            console.error('Error while sending SMS:', error);

            // Send error response
            return res.status(500).json({
                error: "Internal Server Error",
                message: error?.message || "An error occurred while sending SMS.",
            });
        }
    }
}

export default SMSController;
