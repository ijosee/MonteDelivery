import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.cuid(),
  name: z.string().min(1, { message: 'El nombre del producto es obligatorio.' }),
  description: z.string().optional(),
  priceEur: z.number().positive({
    message: 'El precio debe ser un número positivo.',
  }),
  imageUrl: z.string().min(1, {
    message: 'La imagen del producto es obligatoria.',
  }),
  allergenIds: z.array(
    z.number().int().min(1).max(14, {
      message: 'El ID de alérgeno debe estar entre 1 y 14.',
    }),
  ),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
