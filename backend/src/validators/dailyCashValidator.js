import { z } from "zod";

const expenseSchema = z.object({ description: z.string().optional(), amount: z.coerce.number().min(0) });
const supplierPaymentSchema = z.object({ metodo: z.string().optional(), total: z.coerce.number().min(0) });

export const closeDailyCashSchema = z.object({
  extraExpenses: z.array(expenseSchema).optional(),
  supplierPayments: z.array(supplierPaymentSchema).optional(),
  finalReal: z.coerce.number().optional().nullable(),
});

export const updateDailyCashSchema = z.object({
  status: z.string().optional(),
  description: z.string().optional(),
});

export default { closeDailyCashSchema, updateDailyCashSchema };
