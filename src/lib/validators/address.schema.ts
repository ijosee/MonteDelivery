import { z } from 'zod';

export const createAddressSchema = z.object({
  street: z.string().min(1, { message: 'La calle es obligatoria.' }),
  municipality: z.string().min(1, { message: 'El municipio es obligatorio.' }),
  city: z.string().min(1, { message: 'La ciudad es obligatoria.' }),
  postalCode: z.string().regex(/^\d{5}$/, {
    message: 'El código postal debe tener exactamente 5 dígitos.',
  }),
  floorDoor: z.string().optional(),
  label: z.string().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
