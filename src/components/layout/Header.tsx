import Link from 'next/link';

/**
 * Header — Logo "Pueblo Delivery" + desktop navigation + login button.
 * Visible on all screen sizes; nav links hidden on mobile (BottomNav used instead).
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Pueblo Delivery — Inicio"
        >
          <span aria-hidden="true">🏘️</span>
          <span>Pueblo Delivery</span>
        </Link>

        {/* Desktop navigation — hidden on mobile */}
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Navegación principal">
          <Link
            href="/"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-green-600"
          >
            Restaurantes
          </Link>
          <Link
            href="/como-funciona"
            className="min-h-[44px] flex items-center text-sm font-medium text-gray-700 hover:text-green-600"
          >
            Cómo funciona
          </Link>
        </nav>

        {/* Login button */}
        <Link
          href="/auth/login"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}
