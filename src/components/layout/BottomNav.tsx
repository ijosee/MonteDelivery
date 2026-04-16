'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/como-funciona', label: 'Buscar', icon: '🔍' },
  { href: '/pedidos', label: 'Pedidos', icon: '📋' },
  { href: '/perfil', label: 'Perfil', icon: '👤' },
] as const;

/**
 * BottomNav — Mobile bottom navigation bar.
 * Shows 4 icons: Inicio, Buscar, Pedidos, Perfil.
 * Visible only on mobile (hidden on sm+ breakpoint).
 * Requisitos: 20.2
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white sm:hidden"
      aria-label="Navegación móvil"
    >
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[56px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="text-lg" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
