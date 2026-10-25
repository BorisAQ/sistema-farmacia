import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-farmacia-bolivia-default-key-2026';

export interface TokenPayload {
  userId: string;
  username: string;
  rol: 'ADMIN_CENTRAL' | 'ENCARGADO_FARMACIA' | 'FARMACEUTICO' | 'CONSULTA';
  farmaciaId: string | null;
  farmaciaNombre?: string;
  farmaciaCodigo?: string;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signJwtToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
