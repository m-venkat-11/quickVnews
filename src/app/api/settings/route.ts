import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getPrefs, setPrefs } from '@/lib/db/queries';

export async function GET() {
  const userId = await getSessionUserId();
  return NextResponse.json(getPrefs(userId));
}

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    const body = (await req.json()) as {
      exam?: string; location?: string; topics?: string[]; explain_level?: string; theme?: string;
    };
    setPrefs(userId, body);
    return NextResponse.json({ ok: true, prefs: getPrefs(userId) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
