import Link from 'next/link';

/**
 * Header — Logo "Pueblo Delivery" + desktop navigation.
 * Visible on all screen sizes; nav links hidden on mobile (BottomNav used instead).
 * Requisitos: 20.2
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Pueblo Delivery — Inicio"
        >
          <span aria-hidden="true">🏘️</span>
          <span>Pueblo Delivery</span>
        </Link>

        {/* Desktop navigation — hidden on mobile */}
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Navegación principal">
          <Link
            href="/"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Inicio
          </Link>
          <Link
            href="/como-funciona"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cómo funciona
          </Link>
          <Link
            href="/pedidos"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Pedidos
          </Link>
          <Link
            href="/perfil"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Perfil
          </Link>
        </nav>
      </div>
    </header>
  );
}
