import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/components/article/ArticleCard';
import { GeoMap } from '@/components/home/GeoMap';
import { listArticles } from '@/lib/db/queries';
import { CATEGORY_BY_SLUG } from '@/lib/config';
import type { Article, Priority } from '@/lib/types';

export const revalidate = 300;

const SLUG_MAP: Record<string, { categories: string[]; title: string; blurb: string }> = {
  india: { categories: ['india', 'politics'], title: 'India — National Current Affairs', blurb: 'Central government, Parliament, courts, policy and national affairs.' },
  geopolitics: { categories: ['world'], title: 'Geopolitics', blurb: 'Strategy, diplomacy and power — with the India angle on every story.' },
  world: { categories: ['world'], title: 'World & Geopolitics', blurb: 'Global developments that shape India’s strategic environment.' },
  ap: { categories: ['ap'], title: 'Andhra Pradesh Intelligence', blurb: 'State government, schemes, investments and APPSC-relevant developments.' },
  visakhapatnam: { categories: ['vizag'], title: 'Vizag Intelligence', blurb: 'Only what genuinely matters to the port city — infrastructure, jobs, industry, civic decisions.' },
  economy: { categories: ['economy'], title: 'Indian Economy', blurb: 'RBI, inflation, budget, trade — explained for citizens and exams.' },
  ai: { categories: ['ai'], title: 'Global AI Developments', blurb: 'Models, regulation, semiconductors and AI geopolitics.' },
  science: { categories: ['science'], title: 'Science, Space & Technology', blurb: 'ISRO, NASA, quantum, biotech — difficult science in simple language.' },
  defence: { categories: ['defence'], title: 'Defence & National Security', blurb: 'Armed forces, DRDO, exercises, borders and cyber security.' },
  environment: { categories: ['environment'], title: 'Environment & Climate', blurb: 'Climate, biodiversity, pollution and renewable energy.' },
  government: { categories: ['government'], title: 'Government Schemes & Policies', blurb: 'Schemes decoded: ministry, objective, features, exam relevance.' },
  politics: { categories: ['politics'], title: 'Central Government & Politics', blurb: 'Parliament, bills, cabinet decisions — reported with strict neutrality.' },
  jobs: { categories: ['jobs'], title: 'Government Jobs & Recruitment', blurb: 'UPSC, APPSC, SSC, IBPS, RRB — official notifications prioritized.' },
};

const WINDOWS = [
  { slug: 'all', label: 'All', hours: undefined as number | undefined },
  { slug: '6h', label: 'Last 6 hours', hours: 6 },
  { slug: '24h', label: 'Last 24 hours', hours: 24 },
  { slug: '7d', label: 'Last 7 days', hours: 168 },
];
const PRIORITIES = ['', 'CRITICAL', 'HIGH', 'MEDIUM'] as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const def = SLUG_MAP[slug];
  return { title: def ? def.title : 'Topic' };
}

export default async function TopicPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ window?: string; priority?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const def = SLUG_MAP[slug];
  if (!def) notFound();

  const win = WINDOWS.find((w) => w.slug === sp.window) ?? WINDOWS[0];
  const priority = PRIORITIES.includes((sp.priority ?? '') as (typeof PRIORITIES)[number]) ? (sp.priority as Priority) : undefined;
  const page = Math.max(1, Number(sp.page ?? 1));

  // Multi-category topics (e.g. india+politics) merge two queries into one ranked feed.
  let items: { items: Article[]; total: number };
  if (def.categories.length === 1) {
    const r = listArticles({ category: def.categories[0], hours: win.hours, priority, page, pageSize: 12 });
    items = { items: r.items, total: r.total };
  } else {
    const first = listArticles({ category: def.categories[0], hours: win.hours, priority, pageSize: 60 });
    const second = listArticles({ category: def.categories[1], hours: win.hours, priority, pageSize: 60 });
    const seen = new Set(first.items.map((a) => a.id));
    const merged = [...first.items, ...second.items.filter((a) => !seen.has(a.id))]
      .sort((a, b) => b.importance - a.importance || b.published_at.localeCompare(a.published_at));
    const start = (page - 1) * 12;
    items = { items: merged.slice(start, start + 12), total: merged.length };
  }

  const cat = CATEGORY_BY_SLUG[def.categories[0]];

  // Geopolitical map data: country → counts + top items (last 7 days).
  let geoCounts: Record<string, number> = {};
  let geoArticles: Record<string, { id: string; title: string }[]> = {};
  if (slug === 'geopolitics') {
    const week = listArticles({ category: 'world', hours: 168, pageSize: 60 }).items;
    for (const a of week) {
      for (const c of a.countries) {
        geoCounts[c] = (geoCounts[c] ?? 0) + 1;
        (geoArticles[c] ??= []).push({ id: a.id, title: a.title.replace(/^Sample briefing — /, '') });
      }
    }
  }

  const qs = (over: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const base = { window: win.slug, priority: priority ?? '', page: String(page), ...over };
    for (const [k, v] of Object.entries(base)) if (v) u.set(k, v);
    return `/topic/${slug}?${u.toString()}`;
  };

  return (
    <>
      <header className="panel" style={{ marginBottom: 4 }}>
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">{cat?.icon === 'vizag' ? '⚓' : '◆'}</span>{def.title}</h2>
          <span className="sh-link">{items.total} item{items.total === 1 ? '' : 's'}</span>
        </div>
        <p className="muted small" style={{ margin: 0 }}>{def.blurb}</p>

        <div className="chips" style={{ marginTop: 14 }}>
          {WINDOWS.map((w) => (
            <Link key={w.slug} className={`chip${win.slug === w.slug ? ' active' : ''}`} href={qs({ window: w.slug, page: '1' })}>
              {w.label}
            </Link>
          ))}
        </div>
        <div className="chips" style={{ marginTop: 8 }}>
          {PRIORITIES.map((p) => (
            <Link key={p || 'any'} className={`chip${(priority ?? '') === p ? ' active' : ''}`} href={qs({ priority: p || undefined, page: '1' })}>
              {p || 'Any priority'}
            </Link>
          ))}
        </div>
      </header>

      {slug === 'geopolitics' && <GeoMap counts={geoCounts} articlesByCountry={geoArticles} />}

      {slug === 'visakhapatnam' && (
        <div className="panel" style={{ borderLeft: '3px solid var(--accent)' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 14 }}>Why this matters to Vizag</h3>
          <p className="small muted" style={{ margin: 0 }}>
            Visakhapatnam’s growth story runs through its port, steel plant, IT corridor and airport.
            Infrastructure, jobs and civic decisions here move the whole north-coastal Andhra economy —
            and they are core APPSC exam material.
          </p>
        </div>
      )}

      {items.items.length === 0 ? (
        <div className="empty">
          <h3>No stories in this filter</h3>
          <p>Try a wider time window, or check back after the next 6-hour intelligence cycle.</p>
        </div>
      ) : (
        <div className="grid-cards cols-2">
          {items.items.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}

      {items.total > 12 && (
        <div className="flex gap-3 items-center justify-between">
          {page > 1
            ? <Link className="btn ghost" href={qs({ page: String(page - 1) })}>← Previous</Link>
            : <span />}
          <span className="muted small">Page {page} of {Math.ceil(items.total / 12)}</span>
          {page * 12 < items.total
            ? <Link className="btn ghost" href={qs({ page: String(page + 1) })}>Next →</Link>
            : <span />}
        </div>
      )}
    </>
  );
}
