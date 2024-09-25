import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import { Transaction } from '@/api/entity/payment/Transaction';
import { AppDataSource } from '@/server';

// initializing razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_TEST_KEY_ID || '',
    key_secret: process.env.RAZORPAY_TEST_KEY_SECRET || '',
});

export const createOrder = async (req: Request, res: Response) => {
    try {

        const { amount, currency } = req.body;
        const uniqueId = crypto.randomBytes(16).toString('hex');

        let receipt = `receipt_order_${uniqueId}`;
        if (receipt.length > 40) {
            receipt = receipt.substring(0, 40); // Truncate if exceeds 40 characters
        }

        // setting options for order
        const options = {
            amount: amount * 100,
            currency,
            receipt: receipt,
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
        console.log(error);
        res.status(400).json({ status: 'error', message: 'Not able to create order. Please try again!' });
    }
}


export const addTransactionAndLog = async (
    transactionData: Partial<Transaction>
) => {
    try {

        const transactionRepository = AppDataSource.getRepository(Transaction);

        const transaction = transactionRepository.create(transactionData);
        await transaction.save();

        return transaction;

    } catch (error) {
        console.error('Error processing transaction :', error);
        throw new Error('Transaction processing failed');
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            cartId,
            userId,
            amount,
            currency
        } = req.body;

        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        const paymentMethod = payment.method;

        const key_secret: any = process.env.RAZORPAY_TEST_KEY_SECRET;

        let hmac = crypto.createHmac('sha256', key_secret);
        hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
        let generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            // valid signature
            try {
                // Convert cart to order
                const response = await axios.post(
                    `http://localhost:5000/api/v1/order-management/customer/cart-to-order`,
                    { cartId, customerId: userId },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const transactionData = {
                    userId,
                    orderId: response.data.data.order.id,
                    currency,
                    method: paymentMethod,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    amount,
                    transactionType: 'Payment' as 'Payment',
                    status: 'Success',
                    createdBy: 'system'
                };

                await addTransactionAndLog(transactionData);

                return res.status(200).json({
                    status: "success",
                    message: "Payment verification and order creation successful",
                    data: {
                        order: response.data.data.order,
                        orderItemBookings: response.data.data.orderItems
                    }
                });
            } catch (err: any) {
                console.error('Error converting cart to order:', err);

                const transactionData = {
                    userId,
                    razorpayOrderId: razorpay_order_id,
                    razorpayPaymentId: razorpay_payment_id,
                    amount,
                    currency,
                    method: paymentMethod,
                    transactionType: 'Payment' as 'Payment',
                    status: 'Failed',
                    createdBy: 'system'
                };

                await addTransactionAndLog(transactionData);

                return res.status(400).json({
                    status: "error",
                    message: "Payment verified but failed to convert cart to order",
                });
            }
        } else {
            // Invalid signature
            const transactionData = {
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                amount,
                currency,
                method: paymentMethod,
                transactionType: 'Payment' as 'Payment',
                status: 'Failed',
                createdBy: 'system'
            };

            await addTransactionAndLog(transactionData);

            return res.status(400).json({ status: "error", message: "Signature verification failed" });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


// export const verifyPayment = async (req: Request, res: Response) => {
//     try {

//         const { razorpay_payment_id, razorpay_order_id, razorpay_signature, cartId, userId } = req.body;

//         const key_secret: any = process.env.RAZORPAY_TEST_KEY_SECRET;

//         let hmac = crypto.createHmac('sha256', key_secret);
//         hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
//         let generated_signature = hmac.digest('hex');

//         if (generated_signature === razorpay_signature) {
//             // valid signature

//             // save to DB   

//             // convert cart to order
//             try {
//                 const response = await axios.post(
//                     `http://localhost:5000/api/v1/order-management/customer/cart-to-order`,
//                     { cartId, customerId: userId },
//                     {
//                         headers: {
//                             'Content-Type': 'application/json'
//                         }
//                     }
//                 );

//                 return res.status(200).json({
//                     status: "success",
//                     message: "Payment verification and order creation successful",
//                     data: {
//                         order: response.data.data.order,
//                         orderItemBookings: response.data.data.orderItems
//                     }
//                 });
//             } catch (err) {
//                 console.error('Error converting cart to order:', err);
//                 return res.status(400).json({
//                     status: "error",
//                     message: "Payment verified but failed to convert cart to order",
//                 });
//             }
//         }
//         else {
//             res.status(400).json({ status: "error", message: "signature verification failed" });
//         }

//     } catch (error) {
//         console.error('Error verifying payment:', error);
//         return res.status(500).json({ status: "error", message: "Internal server error" });
//     }
// }

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
