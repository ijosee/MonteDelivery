import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types/database';

/**
 * GET /api/admin/audit-log — Audit logs with filters.
 * Query: userId, action, page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }
    requirePermission(authUser.role as UserRole, 'audit:read');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const supabase = await createClient();

    let query = supabase
      .from('admin_audit_log')
      .select('id, userId, action, resourceType, resourceId, details, ipAddress, createdAt, users(name, email)', { count: 'exact' });

    if (userId) query = query.eq('userId', userId);
    if (action) query = query.eq('action', action);

    const { data: logs, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ data: null, error: 'Error interno del servidor', success: false }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json({
      data: {
        logs: (logs ?? []).map((l: Record<string, unknown>) => {
          const user = l.users as { name: string; email: string } | null;
          return {
            id: l.id,
            userName: user?.name ?? '',
            userEmail: user?.email ?? '',
            action: l.action,
            resourceType: l.resourceType,
            resourceId: l.resourceId,
            details: l.details,
            ipAddress: l.ipAddress,
            createdAt: l.createdAt,
          };
        }),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
