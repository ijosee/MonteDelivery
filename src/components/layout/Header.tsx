import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';
import CartBadge from '@/components/cart/CartBadge';
import type { UserRole } from '@/types/database';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  RESTAURANT_OWNER: 'Propietario',
  RESTAURANT_STAFF: 'Staff',
  CUSTOMER: 'Cliente',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  RESTAURANT_OWNER: 'bg-purple-100 text-purple-700',
  RESTAURANT_STAFF: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-green-100 text-green-700',
};

export default async function Header() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let user: { id: string; name: string | null; email: string | null; role: UserRole | null } | null = null;
  let role: string | null = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', authUser.id)
      .single();

    user = {
      id: authUser.id,
      name: profile?.name ?? null,
      email: authUser.email ?? null,
      role: (profile?.role as UserRole) ?? null,
    };
    role = profile?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-green-600"
        >
          <span aria-hidden="true">🏘️</span>
          <span className="hidden sm:inline">Pueblo Delivery</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-5 sm:flex" aria-label="Navegación principal">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-green-600">
            Restaurantes
          </Link>
          {user && role === 'CUSTOMER' && (
            <>
              <Link href="/pedidos" className="text-sm font-medium text-gray-700 hover:text-green-600">
                Mis pedidos
              </Link>
              <Link href="/carrito" className="text-sm font-medium text-gray-700 hover:text-green-600">
                🛒 Carrito<CartBadge />
              </Link>
            </>
          )}
          {user && (role === 'RESTAURANT_OWNER' || role === 'RESTAURANT_STAFF') && (
            <Link href="/panel" className="text-sm font-medium text-gray-700 hover:text-green-600">
              Panel restaurante
            </Link>
          )}
          {user && role === 'ADMIN' && (
            <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-green-600">
              Panel admin
            </Link>
          )}
        </nav>

        {/* User area */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Role badge */}
              <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-block ${ROLE_COLORS[role ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
                {ROLE_LABELS[role ?? ''] ?? role}
              </span>
              {/* User name */}
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-green-600"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                  {user.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              {/* Sign out */}
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav for logged-in users */}
      {user && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 py-1.5 sm:hidden">
          <Link href="/" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            🏠 Inicio
          </Link>
          {role === 'CUSTOMER' && (
            <>
              <Link href="/pedidos" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                📦 Pedidos
              </Link>
              <Link href="/carrito" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                🛒 Carrito
              </Link>
              <Link href="/perfil" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                👤 Perfil
              </Link>
            </>
          )}
          {(role === 'RESTAURANT_OWNER' || role === 'RESTAURANT_STAFF') && (
            <Link href="/panel" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              🍽️ Panel
            </Link>
          )}
          {role === 'ADMIN' && (
            <Link href="/admin" className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              ⚙️ Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
