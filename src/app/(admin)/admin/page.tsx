'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Metrics {
  orders: {
    today: number;
    week: number;
    month: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    todayEur: number;
    weekEur: number;
    monthEur: number;
  };
  activeRestaurants: number;
  totalUsers: number;
}

const STATUS_LABELS: Record<string, string> = {
  PLACED: 'Pendiente',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
  PREPARING: 'Preparando',
  READY_FOR_PICKUP: 'Listo',
  OUT_FOR_DELIVERY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/metrics');
        const json = await res.json();
        if (json.success && json.data) {
          setMetrics(json.data);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando métricas...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error al cargar métricas</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Panel de administración</h1>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Link href="/admin/restaurantes" className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-green-400 transition-colors">
            <p className="text-2xl mb-1">🍽️</p>
            <p className="text-sm font-medium text-gray-900">Restaurantes</p>
          </Link>
          <Link href="/admin/pedidos" className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-green-400 transition-colors">
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm font-medium text-gray-900">Pedidos</p>
          </Link>
          <Link href="/admin/usuarios" className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-green-400 transition-colors">
            <p className="text-2xl mb-1">👥</p>
            <p className="text-sm font-medium text-gray-900">Usuarios</p>
          </Link>
          <Link href="/admin/auditoria" className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-green-400 transition-colors">
            <p className="text-2xl mb-1">📝</p>
            <p className="text-sm font-medium text-gray-900">Auditoría</p>
          </Link>
        </div>

        {/* Order metrics */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pedidos</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-gray-900">{metrics.orders.today}</p>
            <p className="text-sm text-gray-500">Hoy</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-gray-900">{metrics.orders.week}</p>
            <p className="text-sm text-gray-500">Esta semana</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-gray-900">{metrics.orders.month}</p>
            <p className="text-sm text-gray-500">Este mes</p>
          </div>
        </div>

        {/* Revenue */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingresos (EUR)</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-green-700">{metrics.revenue.todayEur.toFixed(2)} €</p>
            <p className="text-sm text-gray-500">Hoy</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-green-700">{metrics.revenue.weekEur.toFixed(2)} €</p>
            <p className="text-sm text-gray-500">Esta semana</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-green-700">{metrics.revenue.monthEur.toFixed(2)} €</p>
            <p className="text-sm text-gray-500">Este mes</p>
          </div>
        </div>

        {/* Status breakdown */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pedidos por estado</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(metrics.orders.byStatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{STATUS_LABELS[status] ?? status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* General stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-gray-900">{metrics.activeRestaurants}</p>
            <p className="text-sm text-gray-500">Restaurantes activos</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers}</p>
            <p className="text-sm text-gray-500">Usuarios totales</p>
          </div>
        </div>
      </div>
    </div>
  );
}
