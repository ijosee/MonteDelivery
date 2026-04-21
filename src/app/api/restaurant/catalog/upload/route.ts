import { NextResponse } from 'next/server';
import { getAuthUserWithRole } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/rbac';
import { upload } from '@/lib/services/storage.service';

/**
 * POST /api/restaurant/catalog/upload — Upload a product image.
 * Accepts multipart/form-data with a 'file' field.
 */
export async function POST(request: Request) {
  try {
    const authUser = await getAuthUserWithRole();
    if (!authUser) {
      return NextResponse.json({ data: null, error: 'No autenticado', success: false }, { status: 401 });
    }

    requirePermission(authUser.role, 'products:crud');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ data: null, error: 'No se proporcionó archivo', success: false }, { status: 422 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await upload(buffer, key, file.type);

    return NextResponse.json({
      data: { url: result.url, key: result.key },
      error: null,
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al subir imagen';
    const status = message.includes('permisos') ? 403 : 500;
    return NextResponse.json({ data: null, error: message, success: false }, { status });
  }
}
