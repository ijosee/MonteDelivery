import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/addresses/[id] — Remove a saved address.
 * Only the owner of the address can delete it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: 'No autenticado', success: false },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the address belongs to the authenticated user
    const address = await prisma.address.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!address || address.userId !== session.user.id) {
      return NextResponse.json(
        { data: null, error: 'Dirección no encontrada', success: false },
        { status: 404 }
      );
    }

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({
      data: null,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { data: null, error: 'Error al eliminar la dirección', success: false },
      { status: 500 }
    );
  }
}
