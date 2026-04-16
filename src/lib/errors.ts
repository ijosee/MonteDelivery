// src/lib/errors.ts

interface AppError {
  code: string;
  title: string;
  message: string;
  action: string;
  httpStatus: number;
}

const ERRORS = {
  OUTSIDE_SERVICE_AREA: {
    code: 'OUTSIDE_SERVICE_AREA',
    title: '❌ Fuera de zona de servicio',
    message: 'Por ahora solo repartimos en Andalucía. La dirección que has introducido está fuera de nuestra zona actual.',
    action: 'Cambiar dirección',
    httpStatus: 422,
  },
  ADDRESS_NOT_FOUND: {
    code: 'ADDRESS_NOT_FOUND',
    title: '❌ No hemos podido encontrar la dirección',
    message: 'Revisa la calle y el número e inténtalo de nuevo. Usa una dirección postal completa y válida.',
    action: 'Editar dirección',
    httpStatus: 422,
  },
  OUTSIDE_DELIVERY_ZONE: {
    code: 'OUTSIDE_DELIVERY_ZONE',
    title: '🚫 Este restaurante no llega a tu dirección',
    message: 'Este restaurante reparte hasta {maxRadius} km y tu dirección está a {distance} km.',
    action: 'Ver restaurantes cercanos',
    httpStatus: 422,
  },
  RESTAURANT_CLOSED: {
    code: 'RESTAURANT_CLOSED',
    title: '⏰ Restaurante cerrado',
    message: 'Este restaurante está cerrado ahora mismo. Puedes programar tu pedido para más tarde.',
    action: 'Programar pedido',
    httpStatus: 422,
  },
  SLOT_UNAVAILABLE: {
    code: 'SLOT_UNAVAILABLE',
    title: '⏱️ Hora no disponible',
    message: 'La hora seleccionada no está dentro del horario del restaurante. Elige otra hora disponible.',
    action: 'Seleccionar hora',
    httpStatus: 422,
  },
  PRODUCT_UNAVAILABLE: {
    code: 'PRODUCT_UNAVAILABLE',
    title: 'Producto no disponible',
    message: 'El producto {productName} ya no está disponible. Por favor, revisa tu carrito.',
    action: 'Revisar carrito',
    httpStatus: 422,
  },
  PRODUCT_IMAGE_REQUIRED: {
    code: 'PRODUCT_IMAGE_REQUIRED',
    title: 'Imagen obligatoria',
    message: 'La imagen del producto es obligatoria.',
    action: 'Subir imagen',
    httpStatus: 422,
  },
  INVALID_TRANSITION: {
    code: 'INVALID_TRANSITION',
    title: 'Transición no válida',
    message: 'Transición de estado no válida: no se puede pasar de {fromStatus} a {toStatus}.',
    action: '',
    httpStatus: 422,
  },
  CANCEL_NOT_ALLOWED_ASAP: {
    code: 'CANCEL_NOT_ALLOWED_ASAP',
    title: 'Cancelación no permitida',
    message: 'Este pedido ya no se puede cancelar porque está siendo preparado.',
    action: '',
    httpStatus: 422,
  },
  CANCEL_NOT_ALLOWED_SCHEDULED: {
    code: 'CANCEL_NOT_ALLOWED_SCHEDULED',
    title: 'Cancelación no permitida',
    message: 'No puedes cancelar este pedido porque falta menos de 1 hora para la entrega programada.',
    action: '',
    httpStatus: 422,
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    title: 'Acceso denegado',
    message: 'No tienes permisos para realizar esta acción.',
    action: '',
    httpStatus: 403,
  },
  TOO_MANY_ATTEMPTS: {
    code: 'TOO_MANY_ATTEMPTS',
    title: 'Demasiados intentos',
    message: 'Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.',
    action: '',
    httpStatus: 429,
  },
  NO_RESTAURANTS_FOUND: {
    code: 'NO_RESTAURANTS_FOUND',
    title: 'Sin resultados',
    message: 'No se encontraron restaurantes con estos filtros. Prueba a cambiar los criterios de búsqueda.',
    action: 'Cambiar filtros',
    httpStatus: 200,
  },
  CART_EMPTY: {
    code: 'CART_EMPTY',
    title: 'Carrito vacío',
    message: 'Tu carrito está vacío. ¡Explora los restaurantes!',
    action: 'Ver restaurantes',
    httpStatus: 200,
  },
  CART_DIFFERENT_RESTAURANT: {
    code: 'CART_DIFFERENT_RESTAURANT',
    title: 'Restaurante diferente',
    message: 'Ya tienes productos de otro restaurante. ¿Deseas vaciar el carrito y añadir este producto?',
    action: 'Vaciar y añadir',
    httpStatus: 409,
  },
} as const satisfies Record<string, AppError>;

/** Helper to format error messages with dynamic values */
function formatError(error: AppError, params?: Record<string, string | number>): AppError {
  if (!params) return error;
  let message = error.message;
  for (const [key, value] of Object.entries(params)) {
    message = message.replace(`{${key}}`, String(value));
  }
  return { ...error, message };
}

export { ERRORS, formatError };
export type { AppError };
