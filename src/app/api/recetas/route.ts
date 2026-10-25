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
  const tipoAtencion = searchParams.get('tipoAtencion');
  const personaId = searchParams.get('personaId');
  const fechaDesde = searchParams.get('fechaDesde');
  const fechaHasta = searchParams.get('fechaHasta');
  const fuente = searchParams.get('fuente');

  let farmaciaId =
    user.rol === 'ADMIN_CENTRAL' && requestedFarmaciaId
      ? requestedFarmaciaId
      : user.farmaciaId;

  try {
    const where: any = {};
    if (farmaciaId) {
      where.farmaciaId = farmaciaId;
    }

    if (tipoAtencion) {
      where.tipoAtencion = tipoAtencion;
    }

    if (personaId) {
      where.personaId = personaId;
    }

    if (fuente) {
      where.fuenteFinanciamiento = fuente;
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
        usuario: {
          select: { id: true, nombreCompleto: true, username: true },
        },
        farmacia: {
          select: { id: true, nombre: true, codigoFarmacia: true, departamento: true },
        },
        detalles: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 150,
    });

    return NextResponse.json(recetas);
  } catch (error: any) {
    console.error('Error al listar recetas:', error);
    return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      personaId,
      tipoAtencion, // CONSULTA_EXTERNA, ODONTOLOGIA, EMERGENCIA, INTERNACION
      periodoInicio,
      periodoFin,
      salaCamaInternacion,
      observaciones,
      detalles, // Array: [{ medicamentoId, cantidad }]
    } = body;

    // 1. Determinar farmacia del usuario
    let farmaciaId = user.rol === 'ADMIN_CENTRAL' && body.farmaciaId ? body.farmaciaId : user.farmaciaId;
    if (!farmaciaId && user.rol === 'ADMIN_CENTRAL') {
      const primera = await prisma.farmacia.findFirst({ where: { activo: true }, orderBy: { codigoFarmacia: 'asc' } });
      farmaciaId = primera?.id || null;
    }

    if (!farmaciaId) {
      return NextResponse.json({ error: 'Debe especificar la farmacia de emisión' }, { status: 400 });
    }

    // 2. REGLA CLÍNICA OBLIGATORIA: Validar vigencia del paciente
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });

    if (!persona) {
      return NextResponse.json({ error: 'El paciente no está registrado en el sistema' }, { status: 404 });
    }

    if (!persona.vigente) {
      return NextResponse.json(
        {
          error: `EMISIÓN DENEGADA: El paciente ${persona.nombreCompleto} (Matrícula: ${persona.matricula}) NO se encuentra vigente para recibir medicamentos.`,
        },
        { status: 403 }
      );
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
      return NextResponse.json({ error: 'La receta debe contener al menos un medicamento' }, { status: 400 });
    }

    // 3. Obtener medicamentos y calcular totales
    const medicamentoIds = detalles.map((d: any) => d.medicamentoId);
    const medicamentosDb = await prisma.medicamento.findMany({
      where: {
        id: { in: medicamentoIds },
        farmaciaId: farmaciaId, // Asegura que los medicamentos pertenezcan a la misma farmacia
      },
    });

    if (medicamentosDb.length !== medicamentoIds.length) {
      return NextResponse.json(
        { error: 'Uno o más medicamentos no pertenecen al catálogo de esta farmacia o no existen' },
        { status: 400 }
      );
    }

    const mapaMeds = new Map(medicamentosDb.map((m) => [m.id, m]));
    let costoTotalReceta = 0;
    let fuentePredominante: 'F1' | 'F2' = 'F1';

    const detallesParaGuardar = detalles.map((item: any) => {
      const med = mapaMeds.get(item.medicamentoId)!;
      const cantidad = Math.max(1, parseInt(item.cantidad, 10) || 1);
      const costoUnitario = Number(med.costoUnitario);
      const subtotal = costoUnitario * cantidad;
      costoTotalReceta += subtotal;
      fuentePredominante = med.fuenteFinanciamiento;

      return {
        medicamentoId: med.id,
        cantidad,
        costoUnitario,
        costoTotal: subtotal,
        fuenteFinanciamiento: med.fuenteFinanciamiento,
      };
    });

    // 4. Generar número correlativo de receta
    const farmacia = await prisma.farmacia.findUnique({ where: { id: farmaciaId } });
    const countRecetas = await prisma.receta.count({ where: { farmaciaId } });
    const correlativo = String(countRecetas + 1).padStart(5, '0');
    const anio = new Date().getFullYear();
    const numeroReceta = `${farmacia?.codigoFarmacia || 'FAR'}-${anio}-${correlativo}`;

    // 5. Transacción de creación y descuento de stock
    const nuevaReceta = await prisma.$transaction(async (tx) => {
      const recetaCreada = await tx.receta.create({
        data: {
          numeroReceta,
          fecha: new Date(),
          farmaciaId,
          usuarioId: user.userId,
          personaId,
          tipoAtencion,
          periodoInicio: periodoInicio ? new Date(periodoInicio) : null,
          periodoFin: periodoFin ? new Date(periodoFin) : null,
          salaCamaInternacion: salaCamaInternacion || null,
          fuenteFinanciamiento: fuentePredominante,
          observaciones: observaciones || null,
          costoTotalReceta,
          detalles: {
            create: detallesParaGuardar,
          },
        },
        include: {
          persona: true,
          farmacia: true,
          usuario: { select: { nombreCompleto: true, username: true } },
          detalles: {
            include: { medicamento: true },
          },
        },
      });

      // Actualizar stocks
      for (const item of detallesParaGuardar) {
        await tx.medicamento.update({
          where: { id: item.medicamentoId },
          data: {
            stockActual: {
              decrement: item.cantidad,
            },
          },
        });
      }

      return recetaCreada;
    });

    return NextResponse.json(nuevaReceta, { status: 201 });
  } catch (error: any) {
    console.error('Error al registrar receta:', error);
    return NextResponse.json({ error: error.message || 'Error al emitir receta' }, { status: 500 });
  }
}
