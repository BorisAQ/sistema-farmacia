import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Sesión cerrada exitosamente' });
  response.cookies.delete('farmacia_session');
  return response;
}
