import express from 'express';
import { createInvoice, getInvoices } from "../../controllers/invoice/InvoiceControllers";

const Router = express.Router();

Router.post('/create-invoice', createInvoice);
Router.post('/get-invoices', getInvoices);

export default Router;