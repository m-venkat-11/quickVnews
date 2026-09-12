import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import {
  getDueReviews, getAllReviews, addToReview, removeFromReview,
  processReview, reviewStats, getArticle,
} from '@/lib/db/queries';

/** GET — review stats and due items */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'due') {
    const due = getDueReviews(userId);
    // Enrich with article data
    const enriched = due.map(r => {
      const article = r.item_type === 'article' ? getArticle(r.item_id) : null;
      return { ...r, article };
    });
    return NextResponse.json({ ok: true, items: enriched });
  }

  if (action === 'all') {
    const all = getAllReviews(userId);
    return NextResponse.json({ ok: true, items: all });
  }

  const stats = reviewStats(userId);
  return NextResponse.json({ ok: true, stats });
}

/** POST — add to review, remove, or process a review rating */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  const body = await req.json() as {
    action: 'add' | 'remove' | 'review';
    itemType?: string;
    itemId?: string;
    quality?: number;
  };

  if (!body.itemId) {
    return NextResponse.json({ error: 'itemId required' }, { status: 400 });
  }

  const itemType = body.itemType ?? 'article';

  switch (body.action) {
    case 'add':
      addToReview(userId, itemType, body.itemId);
      return NextResponse.json({ ok: true, action: 'added' });

    case 'remove':
      removeFromReview(userId, itemType, body.itemId);
      return NextResponse.json({ ok: true, action: 'removed' });

    case 'review': {
      const quality = Math.max(0, Math.min(5, body.quality ?? 3));
      processReview(userId, itemType, body.itemId, quality);
      return NextResponse.json({ ok: true, action: 'reviewed', quality });
    }

    default:
      return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }
}
