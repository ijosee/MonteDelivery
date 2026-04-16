import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cómo funciona — Pueblo Delivery',
  description: 'Guía paso a paso para clientes y restaurantes de Pueblo Delivery.',
};

const CUSTOMER_STEPS = [
  { step: 1, icon: '🍽️', title: 'Elige un restaurante', description: 'Explora los restaurantes disponibles en tu zona y elige el que más te apetezca.' },
  { step: 2, icon: '🛒', title: 'Añade productos al carrito', description: 'Navega el catálogo, revisa los alérgenos y añade los productos que quieras.' },
  { step: 3, icon: '📍', title: 'Introduce tu dirección y elige hora de entrega', description: 'Añade tu dirección de entrega y elige si quieres el pedido lo antes posible o programado.' },
  { step: 4, icon: '✅', title: 'Confirma el pedido', description: 'Revisa el resumen con precios, alérgenos y condiciones. Confirma cuando estés listo.' },
  { step: 5, icon: '📱', title: 'Sigue el estado de tu pedido', description: 'Consulta en tiempo real el estado de tu pedido: aceptado, preparando, en camino...' },
  { step: 6, icon: '💰', title: 'Recibe y paga al repartidor', description: 'Recibe tu pedido en la puerta y paga en efectivo al repartidor.' },
] as const;

const RESTAURANT_STEPS = [
  { step: 1, icon: '📥', title: 'Recibe pedidos en tu panel', description: 'Los pedidos llegan automáticamente a tu panel de gestión.' },
  { step: 2, icon: '✅', title: 'Acepta o rechaza pedidos', description: 'Revisa cada pedido y acéptalo o recházalo con un motivo.' },
  { step: 3, icon: '👨‍🍳', title: 'Marca el pedido como "Preparando"', description: 'Cuando empieces a preparar el pedido, actualiza el estado.' },
  { step: 4, icon: '📦', title: 'Marca como "Listo para recoger"', description: 'Cuando el pedido esté listo, avisa para que el repartidor lo recoja.' },
  { step: 5, icon: '🚗', title: 'Marca como "En camino"', description: 'Cuando el repartidor salga con el pedido, actualiza el estado.' },
  { step: 6, icon: '🎉', title: 'Marca como "Entregado"', description: 'Cuando el cliente reciba el pedido, marca como entregado.' },
] as const;

const FAQ_ITEMS = [
  {
    question: '¿Puedo programar un pedido?',
    answer: 'Sí, puedes elegir una hora exacta de entrega en intervalos de 10 minutos, hasta 2 días en el futuro.',
  },
  {
    question: '¿Puedo cancelar mi pedido?',
    answer: 'Pedidos ASAP: puedes cancelar mientras el restaurante no lo haya aceptado. Pedidos programados: puedes cancelar hasta 60 minutos antes de la hora de entrega si ya fue aceptado, o en cualquier momento si aún no fue aceptado.',
  },
  {
    question: '¿Qué pasa si mi pedido se retrasa?',
    answer: 'La ETA se actualiza automáticamente. Si hay un retraso significativo, el restaurante puede contactarte por teléfono.',
  },
  {
    question: '¿Cómo sé si un producto tiene alérgenos?',
    answer: 'Cada producto muestra sus alérgenos con iconos y texto antes de añadirlo al carrito, conforme al Reglamento UE 1169/2011.',
  },
] as const;

/**
 * Página "Cómo funciona" — Guía paso a paso + FAQ.
 * Requisitos: 21.1, 21.2, 21.3
 */
export default function ComoFuncionaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Cómo funciona</h1>
      <p className="mt-2 text-gray-600">
        Pueblo Delivery conecta clientes con restaurantes locales de Andalucía.
        Aquí te explicamos cómo funciona paso a paso.
      </p>

      {/* Customer guide */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">Para clientes</h2>
        <div className="mt-6 space-y-6">
          {CUSTOMER_STEPS.map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl">
                <span aria-hidden="true">{s.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {s.step}. {s.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Restaurant guide */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">Para restaurantes</h2>
        <div className="mt-6 space-y-6">
          {RESTAURANT_STEPS.map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl">
                <span aria-hidden="true">{s.icon}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {s.step}. {s.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900">Preguntas frecuentes</h2>
        <div className="mt-6 space-y-4">
          {FAQ_ITEMS.map((faq, i) => (
            <details
              key={i}
              className="group rounded-lg border border-gray-200 bg-white"
            >
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                {faq.question}
                <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true">
                  ▼
                </span>
              </summary>
              <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
