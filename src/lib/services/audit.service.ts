// src/lib/services/audit.service.ts
// AuditService — Logs administrative and data access operations

import { createServiceClient } from '@/lib/supabase/service';

// ─── Types ───────────────────────────────────────────────────

export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

// ─── Service ─────────────────────────────────────────────────

/**
 * Registers an entry in admin_audit_log.
 * Used in all administrative operations and personal data access.
 *
 * Fails silently (logs to console) to avoid breaking the main operation
 * if audit logging fails.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceClient();

    await supabase.from('admin_audit_log').insert({
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      details: entry.details ? (structuredClone(entry.details) as Record<string, never>) : null,
      ipAddress: entry.ipAddress ?? null,
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('[AuditService] Failed to log audit entry:', error);
    console.error('[AuditService] Entry:', JSON.stringify(entry));
  }
}
