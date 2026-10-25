import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipoReporte = searchParams.get('tipoReporte'); // 'ATENCIONES' | 'INTERNACION'
  const fuente = searchParams.get('fuente'); // 'F1' | 'F2'
  const fechaDesde = searchParams.get('fechaDesde');
  const fechaHasta = searchParams.get('fechaHasta');
  const personaId = searchParams.get('personaId');
  const requestedFarmaciaId = searchParams.get('farmaciaId');

  let farmaciaId =
    user.rol === 'ADMIN_CENTRAL' && requestedFarmaciaId
      ? requestedFarmaciaId
      : user.farmaciaId;

  if (!farmaciaId && user.rol === 'ADMIN_CENTRAL') {
    const primera = await prisma.farmacia.findFirst({
      where: { activo: true },
      orderBy: { codigoFarmacia: 'asc' },
    });
    farmaciaId = primera?.id || null;
  }

  if (!farmaciaId) {
    return NextResponse.json({ error: 'Farmacia no definida' }, { status: 400 });
  }

  try {
    const where: any = { farmaciaId };

    if (tipoReporte === 'ATENCIONES') {
      where.tipoAtencion = {
        in: ['CONSULTA_EXTERNA', 'ODONTOLOGIA', 'EMERGENCIA'],
      };
    } else if (tipoReporte === 'INTERNACION') {
      where.tipoAtencion = 'INTERNACION';
      if (personaId) {
        where.personaId = personaId;
      }
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
    }

    const recetas = await prisma.receta.findMany({
      where,
      include: {
        persona: true,
        farmacia: true,
        usuario: { select: { nombreCompleto: true } },
        detalles: {
          where: fuente ? { fuenteFinanciamiento: fuente as 'F1' | 'F2' } : {},
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    const recetasFiltradas = recetas.filter((r) => r.detalles.length > 0);

    const itemsReporte: any[] = [];
    let costoTotalGeneral = 0;

    for (const r of recetasFiltradas) {
      for (const d of r.detalles) {
        const subtotal = Number(d.costoTotal);
        costoTotalGeneral += subtotal;

        itemsReporte.push({
          recetaId: r.id,
          numeroReceta: r.numeroReceta,
          fecha: r.fecha.toISOString().split('T')[0],
          pacienteNombre: r.persona.nombreCompleto,
          matricula: r.persona.matricula,
          codigoPersona: r.persona.codigoPersona,
          tipoAtencion: r.tipoAtencion,
          fuenteFinanciamiento: d.fuenteFinanciamiento,
          nombreGenerico: d.medicamento.nombreGenerico,
          nombreComercial: d.medicamento.nombreComercial,
          codigoLiname: d.medicamento.codigoLiname,
          codigoMedicamento: d.medicamento.codigoMedicamento,
          concentracion: d.medicamento.concentracion,
          presentacion: d.medicamento.presentacion,
          cantidad: d.cantidad,
          costoUnitario: Number(d.costoUnitario),
          costoTotal: subtotal,
          salaCamaInternacion: r.salaCamaInternacion,
        });
      }
    }

    return NextResponse.json({
      resumen: {
        totalItems: itemsReporte.length,
        totalRecetas: recetasFiltradas.length,
        costoTotalGeneral,
        fuente: fuente || 'TODAS',
        tipoReporte,
      },
      items: itemsReporte,
    });
  } catch (error: any) {
    console.error('Error al generar reporte:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}
