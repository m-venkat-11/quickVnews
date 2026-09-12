import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { toggleBookmark, getBookmarks } from '@/lib/db/queries';

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    const body = (await req.json()) as { itemId?: string; itemType?: string };
    if (!body.itemId) {
      return NextResponse.json({ error: 'itemId required' }, { status: 400 });
    }
    const type = body.itemType ?? 'article';
    if (!['article', 'fact', 'learning', 'tool'].includes(type)) {
      return NextResponse.json({ error: 'invalid itemType' }, { status: 400 });
    }
    const result = toggleBookmark(userId, type, body.itemId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}

export async function GET() {
  const userId = await getSessionUserId();
  return NextResponse.json({ items: getBookmarks(userId) });
}
