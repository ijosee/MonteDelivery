// src/lib/domain/haversine.ts

const EARTH_RADIUS_KM = 6371;

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula la distancia en km entre dos puntos geográficos usando la fórmula Haversine.
 * Función pura, simétrica, no-negativa.
 */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Verifica si un punto está dentro de un radio dado desde un centro.
 */
function isInsideDeliveryZone(
  customerLat: number, customerLng: number,
  restaurantLat: number, restaurantLng: number,
  radiusKm: number
): boolean {
  return distanceKm(customerLat, customerLng, restaurantLat, restaurantLng) <= radiusKm;
}

export { distanceKm, isInsideDeliveryZone, EARTH_RADIUS_KM };
