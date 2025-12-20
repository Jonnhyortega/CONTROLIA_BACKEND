import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const preApproval = new PreApproval(client);
export const preApprovalPlan = new PreApprovalPlan(client);
export default client;
