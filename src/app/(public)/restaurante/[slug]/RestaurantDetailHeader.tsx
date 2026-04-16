import Image from 'next/image';

interface OpeningHourDisplay {
  dayOfWeek: number;
  dayName: string;
  openTime: string;
  closeTime: string;
}

interface RestaurantDetailHeaderProps {
  name: string;
  imageUrl: string | null;
  cuisineType: string | null;
  isOpen: boolean;
  nextOpeningTime: string | null;
  deliveryFeeEur: number;
  minOrderEur: number;
  deliveryRadiusKm: number;
  openingHours: OpeningHourDisplay[];
}

function hasRealImage(imageUrl: string | null): boolean {
  return !!imageUrl && !imageUrl.startsWith('/placeholder');
}

export default function RestaurantDetailHeader({
  name,
  imageUrl,
  cuisineType,
  isOpen,
  deliveryFeeEur,
  minOrderEur,
  deliveryRadiusKm,
  openingHours,
}: RestaurantDetailHeaderProps) {
  // Group opening hours by day
  const hoursByDay = openingHours.reduce<Record<number, OpeningHourDisplay[]>>(
    (acc, h) => {
      if (!acc[h.dayOfWeek]) acc[h.dayOfWeek] = [];
      acc[h.dayOfWeek].push(h);
      return acc;
    },
    {}
  );

  const showImage = hasRealImage(imageUrl);

  return (
    <div>
      {/* Hero image */}
      <div className="relative h-56 w-full overflow-hidden bg-gray-200 sm:h-72 lg:h-80">
        {showImage ? (
          <Image
            src={imageUrl!}
            alt={`Imagen de ${name}`}
            fill
            unoptimized
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 lg:p-9">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-lg">
            {name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            {cuisineType && (
              <span className="text-sm font-medium text-white/90 sm:text-base">{cuisineType}</span>
            )}
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-semibold shadow-sm ${
                isOpen
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h.008" />
            </svg>
            <span>Envío: {deliveryFeeEur.toFixed(2)} €</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span>Mín. {minOrderEur.toFixed(2)} €</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Radio: {deliveryRadiusKm} km</span>
          </div>
        </div>

        {/* Opening hours */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-green-600 hover:text-green-700">
            Ver horarios
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-gray-600 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const hours = hoursByDay[day];
              const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
              return (
                <div key={day} className="flex justify-between py-0.5">
                  <span className="font-medium">{dayNames[day]}</span>
                  <span>
                    {hours
                      ? hours.map((h) => `${h.openTime}–${h.closeTime}`).join(', ')
                      : 'Cerrado'}
                  </span>
                </div>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  );
}
