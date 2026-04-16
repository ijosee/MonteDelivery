import { z } from 'zod';

export const createOrderSchema = z
  .object({
    addressId: z.cuid(),
    phone: z.string().regex(/^\+34\d{9}$/, {
      message: 'El teléfono debe tener el formato +34XXXXXXXXX.',
    }),
    fulfillmentType: z.enum(['ASAP', 'SCHEDULED']),
    scheduledFor: z.iso.datetime().optional(),
    idempotencyKey: z.uuid(),
  })
  .refine(
    (data) =>
      data.fulfillmentType !== 'SCHEDULED' || data.scheduledFor !== undefined,
    {
      message:
        'La hora programada es obligatoria para pedidos de tipo SCHEDULED.',
      path: ['scheduledFor'],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
