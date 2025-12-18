import { z } from "zod";

export const saleProductSchema = z.object({
  product: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  quantity: z.coerce.number().int().min(1, "Cantidad mínima 1"),
  price: z.coerce.number().min(0),
});

export const createSaleSchema = z.object({
  products: z.array(saleProductSchema).min(1, "Se requiere al menos un producto"),
  total: z.coerce.number().positive("El total debe ser mayor a 0"),
  amountPaid: z.coerce.number().optional().nullable(),
  clientId: z.string().optional().nullable(),
  paymentMethod: z.string().optional(),
});

export default { createSaleSchema };
