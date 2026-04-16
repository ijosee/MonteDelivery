// src/lib/services/audit.service.ts
// AuditService — Logs administrative and data access operations
// Requisitos: 8.7, 16.6, 25.8

import { prisma } from '@/lib/db';

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
    await prisma.adminAuditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        details: entry.details
          ? (structuredClone(entry.details) as Record<string, never>)
          : undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('[AuditService] Failed to log audit entry:', error);
    console.error('[AuditService] Entry:', JSON.stringify(entry));
  }
}
