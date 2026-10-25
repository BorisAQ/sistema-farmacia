import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Si es ADMIN_CENTRAL ve todas, si no solo su farmacia
    const where: any = {};
    if (user.rol !== 'ADMIN_CENTRAL') {
      where.id = user.farmaciaId;
    }

    const farmacias = await prisma.farmacia.findMany({
      where,
      include: {
        _count: {
          select: {
            medicamentos: true,
            recetas: true,
            usuarios: true,
          },
        },
      },
      orderBy: { departamento: 'asc' },
    });

    return NextResponse.json(farmacias);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
