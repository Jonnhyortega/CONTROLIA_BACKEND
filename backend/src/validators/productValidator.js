import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  supplier: z.string().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().optional(),
  cost: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
});

export default { createProductSchema, updateProductSchema };
