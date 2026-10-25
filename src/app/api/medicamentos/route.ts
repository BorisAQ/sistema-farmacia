import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const fuente = searchParams.get('fuente'); // F1 o F2
  const requestedFarmaciaId = searchParams.get('farmaciaId');

  // Aislamiento por farmacia: si no es ADMIN_CENTRAL, siempre usa su farmaciaId asignada
  const farmaciaId =
    user.rol === 'ADMIN_CENTRAL' && requestedFarmaciaId
      ? requestedFarmaciaId
      : user.farmaciaId;

  if (!farmaciaId) {
    return NextResponse.json({ error: 'Debe especificar una farmacia' }, { status: 400 });
  }

  try {
    const where: any = {
      farmaciaId,
      activo: true,
    };

    if (fuente && (fuente === 'F1' || fuente === 'F2')) {
      where.fuenteFinanciamiento = fuente;
    }

    if (q.trim()) {
      where.OR = [
        { nombreGenerico: { contains: q, mode: 'insensitive' } },
        { nombreComercial: { contains: q, mode: 'insensitive' } },
        { codigoLiname: { contains: q, mode: 'insensitive' } },
        { codigoMedicamento: { contains: q, mode: 'insensitive' } },
      ];
    }

    const medicamentos = await prisma.medicamento.findMany({
      where,
      orderBy: { nombreGenerico: 'asc' },
    });

    return NextResponse.json(medicamentos);
  } catch (error: any) {
    console.error('Error al obtener medicamentos:', error);
    return NextResponse.json({ error: 'Error en base de datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const farmaciaId = user.rol === 'ADMIN_CENTRAL' && data.farmaciaId ? data.farmaciaId : user.farmaciaId;

    if (!farmaciaId) {
      return NextResponse.json({ error: 'Farmacia no especificada' }, { status: 400 });
    }

    const medicamento = await prisma.medicamento.create({
      data: {
        farmaciaId,
        codigoMedicamento: data.codigoMedicamento,
        codigoLiname: data.codigoLiname,
        nombreGenerico: data.nombreGenerico,
        nombreComercial: data.nombreComercial,
        concentracion: data.concentracion,
        presentacion: data.presentacion,
        costoUnitario: Number(data.costoUnitario) || 0,
        fuenteFinanciamiento: data.fuenteFinanciamiento || 'F1',
        stockActual: Number(data.stockActual) || 0,
        activo: true,
      },
    });

    return NextResponse.json(medicamento, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
