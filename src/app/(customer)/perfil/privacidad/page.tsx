'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CONSENT_STORAGE_KEY = 'pueblo_cookie_consent';

/**
 * Página de configuración de privacidad.
 * Permite revocar cookies, exportar datos y eliminar cuenta.
 * Requisitos: 16.3, 16.4, 16.5, 16.6, 17.4, 17.5
 */
export default function PrivacidadPage() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRevokeCookies = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    // Remove non-essential cookies from browser
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name && !name.startsWith('sb-') && name !== 'pueblo_cookie_consent') {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    setMessage({ type: 'success', text: 'Consentimiento de cookies revocado. El banner aparecerá de nuevo en tu próxima visita.' });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/export-data', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Error al exportar datos');
      }
      const data = await res.json();
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mis-datos-pueblo-delivery.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Datos exportados correctamente.' });
    } catch {
      setMessage({ type: 'error', text: 'Error al exportar tus datos. Inténtalo de nuevo.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/delete-account', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Error al eliminar cuenta');
      }
      setMessage({ type: 'success', text: 'Tu cuenta ha sido eliminada. Serás redirigido.' });
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      setTimeout(() => router.push('/'), 2000);
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar tu cuenta. Inténtalo de nuevo.' });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración de privacidad</h1>
      <p className="mt-2 text-sm text-gray-600">
        Gestiona tus preferencias de privacidad y datos personales conforme al GDPR.
      </p>

      {message && (
        <div
          role="alert"
          className={`mt-4 rounded-lg p-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Cookies */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Cookies</h2>
        <p className="mt-1 text-sm text-gray-600">
          Puedes revocar tu consentimiento de cookies en cualquier momento. Las cookies
          no necesarias serán eliminadas.
        </p>
        <button
          onClick={handleRevokeCookies}
          className="mt-3 min-h-[44px] rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Revocar consentimiento de cookies
        </button>
      </section>

      {/* Export data */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Exportar mis datos</h2>
        <p className="mt-1 text-sm text-gray-600">
          Descarga un archivo JSON con todos tus datos personales almacenados en la plataforma.
        </p>
        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="mt-3 min-h-[44px] rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isExporting ? 'Exportando...' : 'Exportar mis datos'}
        </button>
      </section>

      {/* Delete account */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Eliminar mi cuenta</h2>
        <p className="mt-1 text-sm text-gray-600">
          Al eliminar tu cuenta, tus datos personales serán anonimizados. Los datos de
          pedidos se mantendrán anonimizados durante 5 años por obligaciones fiscales.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-3 min-h-[44px] rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="min-h-[44px] rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="min-h-[44px] rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
