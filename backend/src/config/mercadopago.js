import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

export const preApproval = new PreApproval(client);
export const preApprovalPlan = new PreApprovalPlan(client);
export default client;
