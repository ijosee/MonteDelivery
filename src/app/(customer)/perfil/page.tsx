'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

const PROFILE_LINKS = [
  { href: '/perfil/direcciones', label: 'Mis direcciones', icon: '📍' },
  { href: '/pedidos', label: 'Mis pedidos', icon: '📋' },
  { href: '/perfil/privacidad', label: 'Configuración de privacidad', icon: '🔒' },
  { href: '/como-funciona', label: 'Cómo funciona', icon: '❓' },
] as const;

/**
 * Página de perfil del cliente.
 * Avatar, nombre, email, links a secciones, botón cerrar sesión.
 * Requisitos: 5.14
 */
export default function PerfilPage() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* User info */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl">
          {session?.user?.name?.[0]?.toUpperCase() ?? '👤'}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {session?.user?.name ?? 'Mi perfil'}
          </h1>
          <p className="text-sm text-gray-500">
            {session?.user?.email ?? ''}
          </p>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="mt-8 space-y-2" aria-label="Opciones de perfil">
        {PROFILE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-[44px] items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">{link.icon}</span>
            <span>{link.label}</span>
            <span className="ml-auto text-gray-400" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="mt-8">
        <button
          onClick={handleSignOut}
          className="min-h-[44px] w-full rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
