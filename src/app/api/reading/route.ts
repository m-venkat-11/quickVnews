import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { markRead, readingStats, getReadIds } from '@/lib/db/queries';

/** GET — reading stats for current user */
export async function GET() {
  const userId = await getSessionUserId();
  const stats = readingStats(userId);
  const readIds = [...getReadIds(userId)];
  return NextResponse.json({ ok: true, stats, readIds });
}

/** POST — mark an article as read */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const body = await req.json() as { articleId?: string; timeSpentMs?: number };
  if (!body.articleId) {
    return NextResponse.json({ error: 'articleId required' }, { status: 400 });
  }
  markRead(userId, body.articleId, body.timeSpentMs ?? 0);
  return NextResponse.json({ ok: true });
}
