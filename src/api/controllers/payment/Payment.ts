import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// initializing razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_TEST_KEY_ID || '',
    key_secret: process.env.RAZORPAY_TEST_KEY_SECRET || '',
});

export const createOrder = async (req: Request, res: Response) => {
    try {

        const { amount, currency } = req.body;
        const uniqueId = crypto.randomBytes(16).toString('hex');

        // setting options for order
        const options = {
            amount: amount * 100,
            currency,
            receipt: `receipt_order_${uniqueId}`,
            // payment_capture: 1,
        }

        const response = await razorpay.orders.create(options);
        res.status(201).json({
            status: "success",
            message: "Razorpay order created successfully",
            data: {
                order_id: response.id,
                currency: response.currency,
                amount: response.amount
            }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: 'Not able to create order. Please try again!' });
    }
}

export const verifyPayment = async (req: Request, res: Response) => {
    try {

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const key_secret: any = process.env.RAZORPAY_TEST_KEY_SECRET;

        let hmac = crypto.createHmac('sha256', key_secret);
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        let generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            // valid signature

            // save to DB

            // rend resoponse
            res.status(200).json({ status: "success", message: "signature verification successful" })
        }
        else {
            res.status(400).json({ status: "error", message: "signature verification failed" });
        }

    } catch (error) {

    }
}

// export const refund = async (req: Request, res: Response) => {
//     try {
//         const { paymentId, amount } = req.body;

//         // Verify the paymentId and then initiate the refund
//         const options = {
//             payment_id: paymentId,
//             amount: amount * 100, // Amount should be in the smallest currency unit
//         };

//         const razorpayResponse = razorpay.payments.refund(options);

//         // Store refund information in the database (pseudo-code)
//         // await saveRefundToDatabase(razorpayResponse);

//         res.send('Successfully refunded');
//     } catch (error) {
//         console.error(error);
//         res.status(400).send('Unable to issue a refund');
//     }

// }
