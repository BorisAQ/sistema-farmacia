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
  const soloVigentes = searchParams.get('soloVigentes') === 'true';

  try {
    const where: any = {};

    if (soloVigentes) {
      where.vigente = true;
    }

    if (q.trim()) {
      where.OR = [
        { nombreCompleto: { contains: q, mode: 'insensitive' } },
        { matricula: { contains: q, mode: 'insensitive' } },
        { codigoPersona: { contains: q, mode: 'insensitive' } },
      ];
    }

    const pacientes = await prisma.persona.findMany({
      where,
      orderBy: { nombreCompleto: 'asc' },
      take: 100,
    });

    return NextResponse.json(pacientes);
  } catch (error: any) {
    console.error('Error al obtener pacientes:', error);
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
    const persona = await prisma.persona.create({
      data: {
        codigoPersona: data.codigoPersona,
        matricula: data.matricula,
        nombreCompleto: data.nombreCompleto,
        sexo: data.sexo,
        fechaNacimiento: new Date(data.fechaNacimiento),
        vigente: Boolean(data.vigente),
        observaciones: data.observaciones || null,
      },
    });
    return NextResponse.json(persona, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
