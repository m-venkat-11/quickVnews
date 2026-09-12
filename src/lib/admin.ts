import { ADMIN_ALLOWED_IPS } from '@/lib/config';

/** Derives the client IP from proxy headers (best-effort, local deployments). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return headers.get('x-real-ip') ?? '127.0.0.1';
}

export function isAdminRequest(headers: Headers): boolean {
  const ip = clientIp(headers);
  if (ADMIN_ALLOWED_IPS.includes(ip)) return true;
  // Loopback variants
  return ip === '::1' || ip.startsWith('::ffff:127.') || ip === '127.0.0.1';
}
