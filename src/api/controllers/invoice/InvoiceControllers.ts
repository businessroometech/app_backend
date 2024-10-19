import { Request, Response } from 'express';
import { AppDataSource } from "../../../server";
import { Invoice } from '../../entity/others/Invoice';
import { Order } from '@/api/entity/orderManagement/customer/Order';

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const {
            invoiceNo,
            issueDate,
            customerId,
            serviceProviderId,
            orderId,
            transactionId,
            createdBy,
        } = req.body;

        // Basic validation
        if (!invoiceNo || !issueDate || !customerId || !serviceProviderId || !orderId || !transactionId) {
            return res.status(400).json({ status: "error", message: 'Missing required fields' });
        }

        const invoice = new Invoice();
        invoice.invoiceNo = invoiceNo;
        invoice.issueDate = issueDate;
        invoice.customerId = customerId;
        invoice.serviceProviderId = serviceProviderId;
        invoice.orderId = orderId;
        invoice.transactionId = transactionId;
        invoice.createdBy = createdBy || 'system';

        await invoice.save();

        return res.status(201).json({ status: "success", message: 'Invoice created successfully', data: { invoice } });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return res.status(500).json({ status: "error", message: 'Error creating invoice' });
    }
};

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const { id, customerId, serviceProviderId } = req.body;

        const invoiceRepository = AppDataSource.getRepository(Invoice);
        const orderRepository = AppDataSource.getRepository(Order);
        let invoices: Invoice[] = [];

        if (id) {
            const invoice = await invoiceRepository.findOne({ where: { id: id as string }, relations: ['transaction'] });
            if (invoice) invoices = [invoice];
        } else if (customerId) {
            invoices = await invoiceRepository.find({ where: { customerId: customerId as string }, relations: ['transaction'] });
        } else if (serviceProviderId) {
            invoices = await invoiceRepository.find({ where: { serviceProviderId: serviceProviderId as string }, relations: ['transaction'] });
        } else {
            invoices = await invoiceRepository.find({ relations: ['transaction'] });
        }

        const invoicesWithOrders = await Promise.all(
            invoices.map(async (invoice) => {
                const order = await orderRepository.findOne({ where: { id: invoice.orderId }, relations: ['orderItems'] });
                return {
                    ...invoice,
                    order,
                };
            })
        );

        return res.status(200).json({
            status: 'success',
            message: 'Fetched invoices successfully',
            data: { invoices: invoicesWithOrders },
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return res.status(500).json({ status: 'error', message: 'Error fetching invoices' });
    }
};
