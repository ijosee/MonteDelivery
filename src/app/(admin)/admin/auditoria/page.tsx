'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuditLog {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (actionFilter) params.set('action', actionFilter);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.logs);
        setPagination(json.data.pagination);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Auditoría</h1>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            placeholder="Filtrar por acción..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Usuario</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Acción</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Recurso</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No hay registros</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('es-ES', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-xs">{log.userName}</p>
                      <p className="text-gray-400 text-xs">{log.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.resourceType}
                      {log.resourceId && <span className="text-gray-400 ml-1">({log.resourceId.slice(0, 8)}...)</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
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
