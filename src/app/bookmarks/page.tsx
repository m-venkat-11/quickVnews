import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleCard } from '@/components/article/ArticleCard';
import { bookmarkedArticles, getBookmarks, allFacts, readingStats, getReadIds, reviewStats } from '@/lib/db/queries';
import { getSessionUserId } from '@/lib/session';

export const metadata: Metadata = { title: 'My Revision & Analytics' };
export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const userId = await getSessionUserId();
  const savedArticles = bookmarkedArticles(userId);
  const all = getBookmarks(userId);
  const factIds = new Set(all.filter((b) => b.item_type !== 'article').map((b) => b.item_id));
  const savedFacts = allFacts().filter((f) => factIds.has(f.id));
  const readStats = readingStats(userId);
  const readIds = getReadIds(userId);
  const revStats = reviewStats(userId);

  return (
    <>
      <header className="panel">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">🔖</span>My Revision & Analytics</h2>
          <span className="sh-link">{all.length} saved · {revStats.due} due for review</span>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Track reading consistency, review bookmarked analysis, and revise using spaced repetition.
        </p>
      </header>

      {/* Reading Activity & Spaced Repetition Summary */}
      <section aria-labelledby="analytics-h" style={{ marginBottom: 20 }}>
        <div className="section-head" style={{ marginBottom: 10 }}>
          <h2 id="analytics-h" style={{ fontSize: 15 }}>Study Activity & Streaks</h2>
          <Link className="sh-link" href="/revision">Launch Spaced Repetition Deck →</Link>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}>
          <div className="panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{readStats.totalRead}</div>
            <div className="small muted">Articles Read</div>
          </div>
          <div className="panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>{readStats.thisWeek}</div>
            <div className="small muted">Read This Week</div>
          </div>
          <div className="panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
              {readStats.streak > 0 ? `🔥 ${readStats.streak}d` : '0d'}
            </div>
            <div className="small muted">Reading Streak</div>
          </div>
          <div className="panel" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--amber)' }}>{revStats.due}</div>
            <div className="small muted">Cards Due Today</div>
          </div>
        </div>

        {readStats.byCategory.length > 0 && (
          <div className="panel" style={{ marginTop: 12, padding: '12px 16px' }}>
            <div className="small muted" style={{ marginBottom: 8, fontWeight: 600 }}>Top Subjects Studied:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {readStats.byCategory.map(c => (
                <span key={c.category} className="tag" style={{ fontSize: 12 }}>
                  {c.category} <b style={{ marginLeft: 4, color: 'var(--accent)' }}>{c.count}</b>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {all.length === 0 ? (
        <div className="empty">
          <h3>Nothing saved yet</h3>
          <p>Tap the bookmark icon on any card, fact or tool — everything lands here for later revision.</p>
          <Link className="btn ghost mt-2" href="/">Browse the feed</Link>
        </div>
      ) : (
        <>
          {savedArticles.length > 0 && (
            <section aria-labelledby="ba-h">
              <div className="section-head">
                <h2 id="ba-h" style={{ fontSize: 15 }}>Saved Articles ({savedArticles.length})</h2>
                <Link className="sh-link" href="/revision">Open Revision Mode →</Link>
              </div>
              <div className="grid-cards cols-2">
                {savedArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} isRead={readIds.has(a.id)} />
                ))}
              </div>
            </section>
          )}

          {savedFacts.length > 0 && (
            <section aria-labelledby="bf-h">
              <div className="section-head"><h2 id="bf-h" style={{ fontSize: 15 }}>Facts, Capsules & Tools</h2></div>
              <div className="grid-cards cols-3">
                {savedFacts.map((f) => (
                  <div key={f.id} className="card">
                    <div className="card-top">
                      <span className="badge gs">{f.kind.toUpperCase()}</span>
                      {f.category && <span className="tag">{f.category}</span>}
                    </div>
                    <h3 className="card-title" style={{ fontSize: 14 }}>{f.title}</h3>
                    <p className="card-summary">{f.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
