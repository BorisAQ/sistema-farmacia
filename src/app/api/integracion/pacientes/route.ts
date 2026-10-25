import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const pacientes = await prisma.persona.findMany({
      orderBy: { nombreCompleto: 'asc' },
    });

    const exportData = pacientes.map((p) => ({
      codigoPersona: p.codigoPersona,
      matricula: p.matricula,
      nombreCompleto: p.nombreCompleto,
      sexo: p.sexo,
      fechaNacimiento: p.fechaNacimiento.toISOString().split('T')[0],
      vigente: p.vigente ? 'SI' : 'NO',
      observaciones: p.observaciones || '',
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
    const rows: any[] = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Datos no válidos o vacíos' }, { status: 400 });
    }

    let insertados = 0;
    let actualizados = 0;

    for (const r of rows) {
      if (!r.codigoPersona || !r.matricula || !r.nombreCompleto) continue;

      const vigenteBool =
        typeof r.vigente === 'boolean'
          ? r.vigente
          : String(r.vigente).toUpperCase() === 'SI' ||
            String(r.vigente).toUpperCase() === 'TRUE' ||
            r.vigente === 1;

      const fecha = r.fechaNacimiento ? new Date(r.fechaNacimiento) : new Date('1990-01-01');

      await prisma.persona.upsert({
        where: { codigoPersona: String(r.codigoPersona).trim() },
        update: {
          matricula: String(r.matricula).trim(),
          nombreCompleto: String(r.nombreCompleto).trim(),
          sexo: r.sexo === 'F' ? 'F' : 'M',
          fechaNacimiento: fecha,
          vigente: vigenteBool,
          observaciones: r.observaciones ? String(r.observaciones) : null,
        },
        create: {
          codigoPersona: String(r.codigoPersona).trim(),
          matricula: String(r.matricula).trim(),
          nombreCompleto: String(r.nombreCompleto).trim(),
          sexo: r.sexo === 'F' ? 'F' : 'M',
          fechaNacimiento: fecha,
          vigente: vigenteBool,
          observaciones: r.observaciones ? String(r.observaciones) : null,
        },
      });

      insertados++;
    }

    return NextResponse.json({
      success: true,
      procesados: insertados,
    });
  } catch (error: any) {
    console.error('Error al importar personas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
