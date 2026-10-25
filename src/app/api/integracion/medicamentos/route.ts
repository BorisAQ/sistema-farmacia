import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedFarmaciaId = searchParams.get('farmaciaId');

  const farmaciaId =
    user.rol === 'ADMIN_CENTRAL' && requestedFarmaciaId
      ? requestedFarmaciaId
      : user.farmaciaId;

  if (!farmaciaId) {
    return NextResponse.json({ error: 'Farmacia no definida' }, { status: 400 });
  }

  try {
    const medicamentos = await prisma.medicamento.findMany({
      where: { farmaciaId },
      include: { farmacia: true },
      orderBy: { nombreGenerico: 'asc' },
    });

    const exportData = medicamentos.map((m) => ({
      codigoMedicamento: m.codigoMedicamento,
      codigoLiname: m.codigoLiname,
      nombreGenerico: m.nombreGenerico,
      nombreComercial: m.nombreComercial,
      concentracion: m.concentracion,
      presentacion: m.presentacion,
      costoUnitario: Number(m.costoUnitario),
      fuenteFinanciamiento: m.fuenteFinanciamiento,
      stockActual: m.stockActual,
      farmacia: m.farmacia.nombre,
      codigoFarmacia: m.farmacia.codigoFarmacia,
    }));

    return NextResponse.json(exportData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { farmaciaId: requestedFarmaciaId, medicamentos } = await request.json();

    const farmaciaId =
      user.rol === 'ADMIN_CENTRAL' && requestedFarmaciaId
        ? requestedFarmaciaId
        : user.farmaciaId;

    if (!farmaciaId) {
      return NextResponse.json({ error: 'Debe especificar la farmacia de destino' }, { status: 400 });
    }

    if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
      return NextResponse.json({ error: 'Lista de medicamentos vacía' }, { status: 400 });
    }

    let contador = 0;

    for (const m of medicamentos) {
      if (!m.codigoMedicamento || !m.nombreGenerico) continue;

      const fuente = m.fuenteFinanciamiento === 'F2' ? 'F2' : 'F1';

      await prisma.medicamento.upsert({
        where: {
          farmaciaId_codigoMedicamento: {
            farmaciaId,
            codigoMedicamento: String(m.codigoMedicamento).trim(),
          },
        },
        update: {
          codigoLiname: String(m.codigoLiname || '').trim(),
          nombreGenerico: String(m.nombreGenerico).trim(),
          nombreComercial: String(m.nombreComercial || m.nombreGenerico).trim(),
          concentracion: String(m.concentracion || '').trim(),
          presentacion: String(m.presentacion || '').trim(),
          costoUnitario: Number(m.costoUnitario) || 0,
          fuenteFinanciamiento: fuente,
          stockActual: Number(m.stockActual) || 0,
          activo: true,
        },
        create: {
          farmaciaId,
          codigoMedicamento: String(m.codigoMedicamento).trim(),
          codigoLiname: String(m.codigoLiname || '').trim(),
          nombreGenerico: String(m.nombreGenerico).trim(),
          nombreComercial: String(m.nombreComercial || m.nombreGenerico).trim(),
          concentracion: String(m.concentracion || '').trim(),
          presentacion: String(m.presentacion || '').trim(),
          costoUnitario: Number(m.costoUnitario) || 0,
          fuenteFinanciamiento: fuente,
          stockActual: Number(m.stockActual) || 0,
          activo: true,
        },
      });

      contador++;
    }

    return NextResponse.json({
      success: true,
      procesados: contador,
    });
  } catch (error: any) {
    console.error('Error al importar medicamentos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
