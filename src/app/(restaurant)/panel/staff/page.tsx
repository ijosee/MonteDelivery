'use client';

import { useState, useEffect, useCallback } from 'react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurant/staff');
      const json = await res.json();
      if (json.success && json.data) {
        setStaff(json.data);
      }
    } catch {
      setError('Error al cargar el staff');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setError('El email es obligatorio');
      return;
    }
    setInviting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/restaurant/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Staff invitado: ${json.data.name} (${json.data.email})`);
        setInviteEmail('');
        await fetchStaff();
      } else {
        setError(json.error ?? 'Error al invitar');
      }
    } catch {
      setError('Error al invitar staff');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de staff</h1>

        {/* Invite form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Invitar nuevo staff</h2>
          <p className="text-sm text-gray-500 mb-3">
            El usuario debe estar registrado en la plataforma.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {inviting ? 'Invitando...' : 'Invitar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Staff list */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Equipo ({staff.length})</h2>
          </div>
          {isLoading ? (
            <p className="p-4 text-sm text-gray-500">Cargando...</p>
          ) : staff.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No hay miembros del equipo</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    member.role === 'OWNER'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {member.role === 'OWNER' ? 'Propietario' : 'Staff'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
