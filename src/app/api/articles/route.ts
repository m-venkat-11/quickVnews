import { NextResponse } from 'next/server';
import { listArticles, type ArticleQuery } from '@/lib/db/queries';
import type { Priority } from '@/lib/types';

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const query: ArticleQuery = {
    category: p.get('category') ?? undefined,
    priority: (p.get('priority') as Priority) ?? undefined,
    hours: p.get('hours') ? Number(p.get('hours')) : undefined,
    q: p.get('q') ?? undefined,
    page: p.get('page') ? Number(p.get('page')) : 1,
    pageSize: p.get('pageSize') ? Number(p.get('pageSize')) : 20,
    runId: p.get('runId') ?? undefined,
  };
  const { items, total } = listArticles(query);
  return NextResponse.json({
    total,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    items: items.map((a) => ({
      id: a.id, title: a.title, quick_summary: a.quick_summary, summary: a.summary,
      why_it_matters: a.why_it_matters, category: a.category, priority: a.priority,
      gs_paper: a.gs_paper, source_name: a.source_name, source_url: a.source_url,
      published_at: a.published_at, is_demo: a.is_demo === 1,
    })),
  });
}
