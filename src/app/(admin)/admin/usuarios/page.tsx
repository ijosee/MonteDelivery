'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  orderCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Cliente',
  RESTAURANT_OWNER: 'Propietario',
  RESTAURANT_STAFF: 'Staff',
  ADMIN: 'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  RESTAURANT_OWNER: 'bg-purple-100 text-purple-800',
  RESTAURANT_STAFF: 'bg-indigo-100 text-indigo-800',
  ADMIN: 'bg-red-100 text-red-800',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (roleFilter) params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data.users);
        setPagination(json.data.pagination);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuarios</h1>

        <div className="flex gap-3 mb-4">
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Todos los roles</option>
            <option value="CUSTOMER">Cliente</option>
            <option value="RESTAURANT_OWNER">Propietario</option>
            <option value="RESTAURANT_STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Rol</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Verificado</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700">Pedidos</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No hay usuarios</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.emailVerified ? '✅' : '❌'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{u.orderCount}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Anterior</button>
            <span className="text-sm text-gray-500">Página {pagination.page} de {pagination.totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
