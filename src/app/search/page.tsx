import type { Metadata } from 'next';
import { ArticleCard } from '@/components/article/ArticleCard';
import { searchArticlesFTS } from '@/lib/db/queries';

export const metadata: Metadata = { title: 'Search' };
export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; window?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const hours = sp.window === '24' ? 24 : sp.window === '168' ? 168 : undefined;

  const result = q ? searchArticlesFTS(q, hours, 30) : { items: [], total: 0 };

  return (
    <>
      <header className="panel">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">⌕</span>Search Intelligence</h2>
          {q && <span className="sh-link">{result.total} result{result.total === 1 ? '' : 's'} for &ldquo;{q}&rdquo;</span>}
        </div>
        <form action="/search" method="get" className="topbar-search" style={{ maxWidth: 'none' }}>
          <input type="search" name="q" defaultValue={q} placeholder='Try "India China", "Article 370", "repo rate", "GS-III"…' aria-label="Search query" />
          {sp.window && <input type="hidden" name="window" value={sp.window} />}
        </form>
        <div className="chips mt-2">
          {['', '24', '168'].map((w) => (
            <a key={w || 'all'} className={`chip${(sp.window ?? '') === w ? ' active' : ''}`} href={`/search?q=${encodeURIComponent(q)}${w ? `&window=${w}` : ''}`}>
              {w === '' ? 'All time' : w === '24' ? 'Last 24 hours' : 'Last 7 days'}
            </a>
          ))}
        </div>
        <p className="muted small mt-2" style={{ margin: '8px 0 0' }}>
          🔍 Powered by FTS5 — searches across titles, summaries, exam tags, countries, entities and GS papers with ranked relevance.
        </p>
      </header>

      {!q ? (
        <div className="empty">
          <h3>Search the full intelligence archive</h3>
          <p>Headlines, summaries, why-it-matters, exam tags, countries, organizations and GS papers are all indexed with full-text search.</p>
        </div>
      ) : result.items.length === 0 ? (
        <div className="empty">
          <h3>No results for &ldquo;{q}&rdquo;</h3>
          <p>Check the spelling, try broader terms (e.g. &ldquo;monsoon&rdquo; instead of a district name), or clear the time filter.</p>
        </div>
      ) : (
        <div className="grid-cards cols-2">
          {result.items.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}
    </>
  );
}
