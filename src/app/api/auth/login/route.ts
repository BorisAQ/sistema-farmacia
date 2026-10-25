import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signJwtToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales incompletas' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { username },
      include: {
        farmacia: true,
      },
    });

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 401 });
    }

    const isMatch = comparePassword(password, usuario.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const payload = {
      userId: usuario.id,
      username: usuario.username,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
      farmaciaId: usuario.farmaciaId,
      farmaciaNombre: usuario.farmacia?.nombre || 'Administración Central',
      farmaciaCodigo: usuario.farmacia?.codigoFarmacia || 'ADM-00',
      departamento: usuario.farmacia?.departamento || 'Nacional',
    };

    const token = signJwtToken(payload);

    const response = NextResponse.json({
      success: true,
      user: payload,
    });

    response.cookies.set({
      name: 'farmacia_session',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: error.message || 'Error en el servidor' }, { status: 500 });
  }
}
