import { Request, Response } from 'express';
import { AppDataSource } from "../../../server";
import { Invoice } from '../../entity/others/Invoice';

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
        const { id, customerId, serviceProviderId } = req.query;

        const invoiceRepository = AppDataSource.getRepository(Invoice);
        let invoices: Invoice | Invoice[] | null;

        if (id) {
            invoices = await invoiceRepository.findOne({ where: { id: id as string } });
        } else if (customerId) {
            invoices = await invoiceRepository.find({ where: { customerId: customerId as string } });
        } else if (serviceProviderId) {
            invoices = await invoiceRepository.find({ where: { serviceProviderId: serviceProviderId as string } });
        } else {
            invoices = await invoiceRepository.find();
        }

        return res.status(200).json({ status: "success", message: "fetched invoice successfully", data: { invoices } });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return res.status(500).json({ status: "error", message: 'Error fetching invoices' });
    }
};
