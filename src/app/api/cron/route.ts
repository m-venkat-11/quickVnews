import { NextResponse } from 'next/server';
import { CRON_SECRET } from '@/lib/config';
import { isAdminRequest } from '@/lib/admin';
import { runIngestion } from '@/lib/news/ingest';

/** Status ping or Vercel Cron trigger (GET). */
export async function GET(req: Request) {
  const secret = CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  const authorized = secret && auth === `Bearer ${secret}`;

  if (!authorized) {
    return NextResponse.json({ ok: true, status: 'ready', hint: 'Send Authorization: Bearer $CRON_SECRET to trigger an update cycle.' });
  }

  const mode = new URL(req.url).searchParams.get('mode') === 'demo' ? 'demo' : 'live';
  try {
    const result = await runIngestion(mode);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'ingestion failed' }, { status: 500 });
  }
}

/** Trigger an update cycle. Auth: Bearer CRON_SECRET, loopback admin, or same-host dev. */
export async function POST(req: Request) {
  const secret = CRON_SECRET;
  const auth = req.headers.get('authorization') ?? '';
  const authorized =
    (secret && auth === `Bearer ${secret}`) ||
    (!secret && isAdminRequest(req.headers));

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized. Set CRON_SECRET and pass it as a Bearer token.' }, { status: 401 });
  }

  const mode = new URL(req.url).searchParams.get('mode') === 'demo' ? 'demo' : 'live';
  try {
    const result = await runIngestion(mode);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'ingestion failed' }, { status: 500 });
  }
}
