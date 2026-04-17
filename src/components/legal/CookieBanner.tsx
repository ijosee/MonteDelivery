'use client';

import { useState, useEffect, useCallback } from 'react';

const CONSENT_STORAGE_KEY = 'pueblo_cookie_consent';

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

/**
 * Cookie Banner — ePrivacy compliant.
 * Shows on first visit. "Necesarias" always active, "Analíticas" and "Marketing" opt-in.
 * Registers consent via POST /api/consent.
 * Requisitos: 17.1, 17.2, 17.3
 */
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) {
      queueMicrotask(() => setVisible(true));
    }
  }, []);

  const saveConsent = useCallback(async (state: ConsentState) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
    setVisible(false);

    // Register consent in DB via API
    try {
      const entries = [
        { consentType: 'NECESSARY', decision: true },
        { consentType: 'ANALYTICS', decision: state.analytics },
        { consentType: 'MARKETING', decision: state.marketing },
      ];
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consents: entries }),
      });
    } catch {
      // Consent registration failure should not block the user
      console.error('[CookieBanner] Error registering consent');
    }
  }, []);

  const acceptAll = useCallback(() => {
    const all: ConsentState = { necessary: true, analytics: true, marketing: true };
    setConsent(all);
    saveConsent(all);
  }, [saveConsent]);

  const acceptSelected = useCallback(() => {
    saveConsent(consent);
  }, [consent, saveConsent]);

  const rejectOptional = useCallback(() => {
    const minimal: ConsentState = { necessary: true, analytics: false, marketing: false };
    setConsent(minimal);
    saveConsent(minimal);
  }, [saveConsent]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Configuración de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-lg font-semibold text-gray-900">
          🍪 Configuración de cookies
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Usamos cookies para mejorar tu experiencia. Las cookies necesarias son
          imprescindibles para el funcionamiento del sitio. Puedes aceptar o
          rechazar las cookies opcionales.
        </p>

        {showDetails && (
          <div className="mt-4 space-y-3">
            {/* Necesarias — always active */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked
                disabled
                className="h-5 w-5 rounded border-gray-300"
                aria-label="Cookies necesarias (siempre activas)"
              />
              <span className="text-sm font-medium text-gray-900">
                Necesarias{' '}
                <span className="text-xs text-gray-500">(siempre activas)</span>
              </span>
            </label>

            {/* Analíticas */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) =>
                  setConsent((prev) => ({ ...prev, analytics: e.target.checked }))
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-label="Cookies analíticas"
              />
              <span className="text-sm text-gray-700">
                Analíticas — nos ayudan a entender cómo usas el sitio
              </span>
            </label>

            {/* Marketing */}
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) =>
                  setConsent((prev) => ({ ...prev, marketing: e.target.checked }))
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-label="Cookies de marketing"
              />
              <span className="text-sm text-gray-700">
                Marketing — permiten mostrarte contenido personalizado
              </span>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={acceptAll}
            className="min-h-[44px] min-w-[44px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Aceptar todas
          </button>
          <button
            onClick={rejectOptional}
            className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Solo necesarias
          </button>
          {showDetails ? (
            <button
              onClick={acceptSelected}
              className="min-h-[44px] min-w-[44px] rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Guardar selección
            </button>
          ) : (
            <button
              onClick={() => setShowDetails(true)}
              className="min-h-[44px] min-w-[44px] px-3 py-2.5 text-sm font-medium text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Configurar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
