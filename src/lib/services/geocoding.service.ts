// src/lib/services/geocoding.service.ts
// GeocodingService — CartoCiudad integration with DB cache
// Requisitos: 15.1, 15.2, 15.3, 15.4

import { createServiceClient } from '@/lib/supabase/service';
import { ERRORS } from '@/lib/errors';

// ─── Types ───────────────────────────────────────────────────

export interface CartoCiudadCandidate {
  address: string;
  municipality: string;
  province: string;
  postalCode: string;
  type: string;
}

export interface GeocodingResult {
  lat: number;
  lng: number;
  comunidadAutonoma: string;
  municipality: string;
  postalCode: string;
}

// ─── Constants ───────────────────────────────────────────────

const CARTOCIUDAD_BASE =
  process.env.CARTOCIUDAD_BASE_URL ??
  'https://www.cartociudad.es/geocoder/api/geocoder';

/** Provincias de Andalucía para filtrar candidatos */
const ANDALUCIA_PROVINCES = new Set([
  'almería',
  'almeria',
  'cádiz',
  'cadiz',
  'córdoba',
  'cordoba',
  'granada',
  'huelva',
  'jaén',
  'jaen',
  'málaga',
  'malaga',
  'sevilla',
]);

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Normaliza una cadena de dirección para usar como clave de caché.
 * Lowercase, sin diacríticos, espacios normalizados, trimmed.
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    .replaceAll(/\s+/g, ' ')
    .trim();
}

// ─── CartoCiudad API ─────────────────────────────────────────

/**
 * Busca candidatos de dirección vía CartoCiudad endpoint `candidates`.
 * Filtra resultados para mostrar solo direcciones de Andalucía.
 */
export async function searchCandidates(
  query: string,
  limit = 5,
): Promise<CartoCiudadCandidate[]> {
  const url = new URL(`${CARTOCIUDAD_BASE}/candidates`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('no_process', 'municipio,provincia,comunidad,poblacion');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  // CartoCiudad returns an array of candidates
  const candidates: CartoCiudadCandidate[] = Array.isArray(data) ? data : [];

  // Filter by Andalucía provinces
  return candidates
    .filter((c) => {
      const province = (c.province ?? '').toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
      return ANDALUCIA_PROVINCES.has(province);
    })
    .slice(0, limit);
}

/**
 * Geocodifica una dirección completa vía CartoCiudad endpoint `find`.
 * 1. Verifica geocoding_cache por cadena normalizada
 * 2. Si cache miss, llama a CartoCiudad
 * 3. Valida comunidadAutonoma === "Andalucía"
 * 4. Almacena resultado en cache
 *
 * @throws Error with OUTSIDE_SERVICE_AREA code if not in Andalucía
 * @throws Error with ADDRESS_NOT_FOUND code if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const normalized = normalizeAddress(address);
  const supabase = createServiceClient();

  // 1. Check cache
  const { data: cached } = await supabase
    .from('geocoding_cache')
    .select()
    .eq('normalizedAddress', normalized)
    .single();

  if (cached) {
    // Validate Andalucía even from cache
    if (cached.comunidadAutonoma !== 'Andalucía') {
      throw Object.assign(new Error(ERRORS.OUTSIDE_SERVICE_AREA.message), {
        code: ERRORS.OUTSIDE_SERVICE_AREA.code,
        httpStatus: ERRORS.OUTSIDE_SERVICE_AREA.httpStatus,
      });
    }

    return {
      lat: cached.lat,
      lng: cached.lng,
      comunidadAutonoma: cached.comunidadAutonoma ?? '',
      municipality: cached.municipality ?? '',
      postalCode: cached.postalCode ?? '',
    };
  }

  // 2. Cache miss — call CartoCiudad `find` endpoint
  const url = new URL(`${CARTOCIUDAD_BASE}/find`);
  url.searchParams.set('q', address);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw Object.assign(new Error(ERRORS.ADDRESS_NOT_FOUND.message), {
      code: ERRORS.ADDRESS_NOT_FOUND.code,
      httpStatus: ERRORS.ADDRESS_NOT_FOUND.httpStatus,
    });
  }

  const data = await response.json();

  // CartoCiudad `find` returns a single result object
  if (!data || data.lat === undefined || data.lng === undefined) {
    throw Object.assign(new Error(ERRORS.ADDRESS_NOT_FOUND.message), {
      code: ERRORS.ADDRESS_NOT_FOUND.code,
      httpStatus: ERRORS.ADDRESS_NOT_FOUND.httpStatus,
    });
  }

  const lat = Number.parseFloat(data.lat);
  const lng = Number.parseFloat(data.lng);
  const comunidadAutonoma: string = data.state ?? data.comunidadAutonoma ?? '';
  const municipality: string = data.muni ?? data.municipality ?? '';
  const postalCode: string = data.postalCode ?? data.tip_via ?? '';

  // 3. Validate Andalucía
  if (comunidadAutonoma !== 'Andalucía') {
    // Still cache the result to avoid repeated API calls
    await supabase.from('geocoding_cache').insert({
      normalizedAddress: normalized,
      lat,
      lng,
      comunidadAutonoma: comunidadAutonoma || null,
      municipality: municipality || null,
      postalCode: postalCode || null,
    });

    throw Object.assign(new Error(ERRORS.OUTSIDE_SERVICE_AREA.message), {
      code: ERRORS.OUTSIDE_SERVICE_AREA.code,
      httpStatus: ERRORS.OUTSIDE_SERVICE_AREA.httpStatus,
    });
  }

  // 4. Store in cache
  await supabase.from('geocoding_cache').insert({
    normalizedAddress: normalized,
    lat,
    lng,
    comunidadAutonoma,
    municipality: municipality || null,
    postalCode: postalCode || null,
  });

  return {
    lat,
    lng,
    comunidadAutonoma,
    municipality,
    postalCode,
  };
}
