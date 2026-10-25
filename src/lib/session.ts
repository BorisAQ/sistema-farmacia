import { cookies } from 'next/headers';
import { verifyJwtToken, TokenPayload } from './auth';

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('farmacia_session')?.value;
  if (!token) return null;
  return verifyJwtToken(token);
}
