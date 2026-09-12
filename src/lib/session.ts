import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { APP } from '@/lib/config';

const COOKIE = 'prism_uid';
const SECRET = process.env.SESSION_SECRET || 'prism-current-dev-secret';
const MAX_AGE = 60 * 60 * 24 * 365;

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('base64url');
}

function verify(value: string, sig: string): boolean {
  const expected = Buffer.from(sign(value));
  const got = Buffer.from(sig);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Reads the anonymous session user id; creates a signed cookie if absent. */
export async function getSessionUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) {
    const idx = existing.lastIndexOf('.');
    if (idx > 0) {
      const value = existing.slice(0, idx);
      const sig = existing.slice(idx + 1);
      if (verify(value, sig)) return value;
    }
  }
  const id = `user_${randomUUID()}`;
  try {
    store.set(COOKIE, `${id}.${sign(id)}`, {
      httpOnly: true, sameSite: 'lax', maxAge: MAX_AGE, path: '/',
    });
  } catch {
    // Read-only cookie context (e.g. RSC render) — the id is still usable for this request.
  }
  return id;
}

export const SESSION_COOKIE = COOKIE;
