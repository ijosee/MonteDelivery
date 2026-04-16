'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface CartoCiudadCandidate {
  address: string;
  municipality: string;
  province: string;
  postalCode: string;
  type: string;
}

export interface UseAddressSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  candidates: CartoCiudadCandidate[];
  isLoading: boolean;
  selectCandidate: (candidate: CartoCiudadCandidate) => void;
  selectedAddress: CartoCiudadCandidate | null;
  clearSelection: () => void;
}

/**
 * Hook para autocompletado de direcciones vía CartoCiudad.
 * Debounce de 300ms en la búsqueda.
 * Filtra resultados para mostrar solo Andalucía (server-side).
 */
export function useAddressSearch(): UseAddressSearchReturn {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<CartoCiudadCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CartoCiudadCandidate | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if query is too short or an address is already selected
    if (query.trim().length < 3 || selectedAddress) {
      setCandidates([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      // Abort previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      try {
        const response = await fetch(
          `/api/geocoding/candidates?q=${encodeURIComponent(query.trim())}&limit=5`,
          { signal: abortRef.current.signal }
        );

        if (response.ok) {
          const data = await response.json();
          setCandidates(Array.isArray(data) ? data : []);
        } else {
          setCandidates([]);
        }
      } catch {
        // Ignore abort errors
        setCandidates([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, selectedAddress]);

  const selectCandidate = useCallback((candidate: CartoCiudadCandidate) => {
    setSelectedAddress(candidate);
    setQuery(candidate.address);
    setCandidates([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedAddress(null);
    setQuery('');
    setCandidates([]);
  }, []);

  return {
    query,
    setQuery,
    candidates,
    isLoading,
    selectCandidate,
    selectedAddress,
    clearSelection,
  };
}
