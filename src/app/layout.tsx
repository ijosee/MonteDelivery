import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import { CartProvider } from '@/contexts/cart-context';
import CookieBanner from '@/components/legal/CookieBanner';
import Header from '@/components/layout/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pueblo Delivery — Comida a domicilio en tu pueblo',
  description:
    'Marketplace de delivery para pueblos y ciudades de Andalucía. Pide comida a domicilio de restaurantes locales.',
  keywords: ['delivery', 'comida a domicilio', 'Andalucía', 'restaurantes', 'pedidos'],
  openGraph: {
    title: 'Pueblo Delivery — Comida a domicilio en tu pueblo',
    description:
      'Marketplace de delivery para pueblos y ciudades de Andalucía.',
    locale: 'es_ES',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <CartProvider>
            <Header />
            {children}
            <CookieBanner />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
