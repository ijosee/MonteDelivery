'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAddressSearch } from '@/hooks/use-address-search';

// ─── Types ───────────────────────────────────────────────────

interface SavedAddress {
  id: string;
  label: string | null;
  street: string;
  municipality: string;
  city: string;
  postalCode: string;
  floorDoor: string | null;
}

interface CartData {
  id: string;
  restaurantId: string | null;
  restaurantName: string | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    priceEur: number;
    quantity: number;
    notes: string | null;
  }>;
  subtotalEur: number;
}

interface SlotData {
  date: string;
  slots: string[];
}

// ─── Component ───────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartData | null>(null);
  const [cartLoading, setCartLoading] = useState(true);

  // Step 1 — Address
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [phone, setPhone] = useState('+34');
  const [newAddressFloorDoor, setNewAddressFloorDoor] = useState('');
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const addressSearch = useAddressSearch();

  // Step 2 — Delivery type
  const [fulfillmentType, setFulfillmentType] = useState<'ASAP' | 'SCHEDULED'>('ASAP');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Step 3 — Confirm
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // ─── Load cart ─────────────────────────────────────────────

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await fetch('/api/cart');
        const json = await res.json();
        if (json.success && json.data && json.data.items.length > 0) {
          setCart(json.data);
        } else {
          router.push('/carrito');
        }
      } catch {
        router.push('/carrito');
      } finally {
        setCartLoading(false);
      }
    }
    loadCart();
  }, [router]);

  // ─── Load saved addresses ─────────────────────────────────

  useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await fetch('/api/addresses');
        const json = await res.json();
        if (json.success && json.data) {
          setSavedAddresses(json.data);
        }
      } catch {
        // Silently fail
      }
    }
    loadAddresses();
  }, []);

  // ─── Load delivery fee from restaurant ────────────────────

  useEffect(() => {
    if (!cart?.restaurantId) return;
    // We need the restaurant slug or ID to get delivery fee
    // For now, fetch from the restaurants API by searching
    async function loadRestaurantInfo() {
      try {
        const res = await fetch(`/api/restaurants`);
        const json = await res.json();
        if (json.success && json.data) {
          const restaurant = json.data.find(
            (r: { id: string; deliveryFeeEur: number }) => r.id === cart?.restaurantId
          );
          if (restaurant) {
            setDeliveryFee(restaurant.deliveryFeeEur);
          }
        }
      } catch {
        // Silently fail
      }
    }
    loadRestaurantInfo();
  }, [cart?.restaurantId]);

  // ─── Load available slots when date changes ───────────────

  const loadSlots = useCallback(async (date: string) => {
    if (!cart?.restaurantId || !date) return;
    setSlotsLoading(true);
    try {
      const res = await fetch(
        `/api/restaurants/${cart.restaurantId}/available-slots?date=${date}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        const slotData = json.data as SlotData;
        setAvailableSlots(slotData.slots);
      } else {
        setAvailableSlots([]);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [cart?.restaurantId]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, loadSlots]);

  // ─── Handlers ──────────────────────────────────────────────

  const handleSaveNewAddress = async () => {
    if (!addressSearch.selectedAddress) {
      setError('Selecciona una dirección del autocompletado.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: addressSearch.selectedAddress.address,
          municipality: addressSearch.selectedAddress.municipality,
          city: addressSearch.selectedAddress.province,
          postalCode: addressSearch.selectedAddress.postalCode,
          floorDoor: newAddressFloorDoor || undefined,
          label: newAddressLabel || undefined,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setSavedAddresses((prev) => [json.data, ...prev]);
        setSelectedAddressId(json.data.id);
        setShowNewAddress(false);
        addressSearch.clearSelection();
        setNewAddressFloorDoor('');
        setNewAddressLabel('');
      } else {
        setError(json.error ?? 'Error al guardar la dirección');
      }
    } catch {
      setError('Error al guardar la dirección');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddressId || !termsAccepted) return;

    setError(null);
    setIsSubmitting(true);

    try {
      let scheduledFor: string | undefined;
      if (fulfillmentType === 'SCHEDULED' && selectedDate && selectedSlot) {
        scheduledFor = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId: selectedAddressId,
          phone,
          fulfillmentType,
          scheduledFor,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        // Navigate to confirmation page
        router.push(`/checkout/confirmacion?orderId=${json.data.id}`);
      } else {
        setError(json.error ?? 'Error al crear el pedido');
      }
    } catch {
      setError('Error al crear el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Date options for SCHEDULED ────────────────────────────

  const getDateOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i <= 2; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const value = d.toISOString().split('T')[0];
      let label: string;
      if (i === 0) {
        label = 'Hoy';
      } else if (i === 1) {
        label = 'Mañana';
      } else {
        label = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      }
      options.push({ value, label });
    }
    return options;
  };

  // ─── Computed values ───────────────────────────────────────

  const subtotal = cart?.subtotalEur ?? 0;
  const total = subtotal + deliveryFee;

  const phoneRegex = /^\+34\d{9}$/;
  const canProceedStep1 = selectedAddressId && phoneRegex.exec(phone);
  const canProceedStep2 =
    fulfillmentType === 'ASAP' ||
    (fulfillmentType === 'SCHEDULED' && selectedDate && selectedSlot);
  const canConfirm = termsAccepted && !isSubmitting;

  // ─── Loading state ─────────────────────────────────────────

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando checkout...</p>
      </div>
    );
  }

  if (!cart) return null;

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-sm text-gray-500 mb-6">
          Pedido de {cart.restaurantName}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => {
            let stepClass = 'bg-gray-200 text-gray-500';
            if (s === step) stepClass = 'bg-green-600 text-white';
            else if (s < step) stepClass = 'bg-green-100 text-green-700';
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${stepClass}`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-12 h-0.5 ${s < step ? 'bg-green-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ─── Step 1: Address ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📍 Dirección de entrega
            </h2>

            {/* Saved addresses */}
            {savedAddresses.length > 0 && !showNewAddress && (
              <div className="space-y-2 mb-4">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {addr.label ?? addr.street}
                    </p>
                    <p className="text-sm text-gray-500">
                      {addr.street}, {addr.municipality}, {addr.postalCode}
                    </p>
                    {addr.floorDoor && (
                      <p className="text-sm text-gray-400">{addr.floorDoor}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Add new address button */}
            {!showNewAddress && (
              <button
                type="button"
                onClick={() => setShowNewAddress(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors mb-4"
              >
                + Añadir nueva dirección
              </button>
            )}

            {/* New address form */}
            {showNewAddress && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 space-y-3">
                <h3 className="font-medium text-gray-900">Nueva dirección</h3>

                {/* Street with autocomplete */}
                <div className="relative">
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                    Calle y número *
                  </label>
                  <input
                    id="street"
                    type="text"
                    value={addressSearch.query}
                    onChange={(e) => addressSearch.setQuery(e.target.value)}
                    placeholder="Ej: Calle Mayor 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    autoComplete="off"
                  />
                  {addressSearch.isLoading && (
                    <p className="text-xs text-gray-400 mt-1">Buscando...</p>
                  )}
                  {addressSearch.candidates.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {addressSearch.candidates.map((c) => (
                        <li key={`${c.address}-${c.postalCode}`}>
                          <button
                            type="button"
                            onClick={() => addressSearch.selectCandidate(c)}
                            className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium text-gray-900">{c.address}</p>
                            <p className="text-xs text-gray-500">
                              {c.municipality}, {c.province} — {c.postalCode}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Municipality (auto-filled from selection) */}
                {addressSearch.selectedAddress && (
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Municipio:</span>{' '}
                      {addressSearch.selectedAddress.municipality}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">CP:</span>{' '}
                      {addressSearch.selectedAddress.postalCode}
                    </p>
                  </div>
                )}

                {/* Floor/door */}
                <div>
                  <label htmlFor="floorDoor" className="block text-sm font-medium text-gray-700 mb-1">
                    Piso / Puerta (opcional)
                  </label>
                  <input
                    id="floorDoor"
                    type="text"
                    value={newAddressFloorDoor}
                    onChange={(e) => setNewAddressFloorDoor(e.target.value)}
                    placeholder="Ej: 2ºB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>

                {/* Label */}
                <div>
                  <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                    Etiqueta (opcional)
                  </label>
                  <input
                    id="label"
                    type="text"
                    value={newAddressLabel}
                    onChange={(e) => setNewAddressLabel(e.target.value)}
                    placeholder="Ej: Casa, Trabajo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNewAddress}
                    disabled={!addressSearch.selectedAddress || isSubmitting}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar dirección'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddress(false);
                      addressSearch.clearSelection();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Phone */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono de contacto *
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34612345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
              {phone && !phoneRegex.exec(phone) && phone !== '+34' && (
                <p className="text-xs text-red-500 mt-1">
                  El teléfono debe tener el formato +34XXXXXXXXX
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        )}

        {/* ─── Step 2: Delivery type ──────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              🚚 Tipo de entrega
            </h2>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setFulfillmentType('ASAP')}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  fulfillmentType === 'ASAP'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">⚡ Lo antes posible</p>
                <p className="text-sm text-gray-500">
                  Entrega estimada según disponibilidad
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('SCHEDULED')}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  fulfillmentType === 'SCHEDULED'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">📅 Programar entrega</p>
                <p className="text-sm text-gray-500">
                  Elige día y hora para tu entrega
                </p>
              </button>
            </div>

            {/* Slot selector for SCHEDULED */}
            {fulfillmentType === 'SCHEDULED' && (
              <div className="space-y-3 mb-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <select
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                  >
                    <option value="">Selecciona una fecha</option>
                    {getDateOptions().map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDate && (
                  <div>
                    <label htmlFor="slot" className="block text-sm font-medium text-gray-700 mb-1">
                      Hora
                    </label>
                    {slotsLoading && (
                      <p className="text-sm text-gray-400">Cargando horarios...</p>
                    )}
                    {!slotsLoading && availableSlots.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No hay horarios disponibles para esta fecha.
                      </p>
                    )}
                    {!slotsLoading && availableSlots.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              selectedSlot === slot
                                ? 'bg-green-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:border-green-500'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Confirm ────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              ✅ Confirmar pedido
            </h2>

            {/* Order summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">Resumen del pedido</h3>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {(item.priceEur * item.quantity).toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
              <hr className="my-3" />
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">{deliveryFee.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-base font-bold mt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-700">{total.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Entrega:</span>{' '}
                {fulfillmentType === 'ASAP'
                  ? 'Lo antes posible'
                  : `Programada — ${selectedDate} a las ${selectedSlot}`}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Pago:</span> Contra entrega (efectivo)
              </p>
            </div>

            {/* Info Precontractual */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Información precontractual</p>
              <p>Restaurante: {cart.restaurantName}</p>
              <p>
                Precio total desglosado: Subtotal {subtotal.toFixed(2)} € + Envío{' '}
                {deliveryFee.toFixed(2)} € = Total {total.toFixed(2)} €
              </p>
              <p>Forma de pago: Contra entrega (efectivo)</p>
              <p>
                Condiciones de cancelación: Los pedidos ASAP solo pueden cancelarse en
                estado &quot;Pendiente&quot;. Los pedidos programados pueden cancelarse hasta 60
                minutos antes de la hora de entrega.
              </p>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">
                Acepto las condiciones de uso y la política de privacidad. He leído la
                información precontractual.
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={!canConfirm}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Procesando...' : `Confirmar pedido — ${total.toFixed(2)} €`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
