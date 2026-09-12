import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleCard } from '@/components/article/ArticleCard';
import { listArticles, factsForDate } from '@/lib/db/queries';

export const metadata: Metadata = { title: 'UPSC / APPSC Radar' };
export const revalidate = 300;

const PAPERS = [
  { key: 'GS-I', label: 'GS-I', blurb: 'History, Geography, Society' },
  { key: 'GS-II', label: 'GS-II', blurb: 'Polity, Governance, IR' },
  { key: 'GS-III', label: 'GS-III', blurb: 'Economy, Security, S&T, Environment' },
  { key: 'GS-IV', label: 'GS-IV', blurb: 'Ethics, Integrity, Aptitude' },
  { key: 'APPSC', label: 'APPSC', blurb: 'State-focused coverage' },
];

export default async function UpscPage({ searchParams }: { searchParams: Promise<{ paper?: string }> }) {
  const sp = await searchParams;
  const paper = PAPERS.find((p) => p.key === sp.paper)?.key ?? 'GS-II';

  const all = listArticles({ pageSize: 60 }).items;
  const paperItems = all.filter((a) => a.gs_paper === paper);
  const prelimsItems = all.filter((a) => a.prelims_fact);
  const daily = factsForDate();

  return (
    <>
      <header className="panel">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">📚</span>Exam Radar — news mapped to your syllabus</h2>
          <span className="sh-link">{all.filter((a) => a.gs_paper).length} GS-tagged items in archive</span>
        </div>
        <div className="chips mt-2">
          {PAPERS.map((p) => (
            <Link key={p.key} href={`/upsc?paper=${p.key}`} className={`chip${paper === p.key ? ' active' : ''}`} title={p.blurb}>
              {p.label}
            </Link>
          ))}
        </div>
        <p className="muted small mt-2" style={{ margin: 0 }}>
          {PAPERS.find((p) => p.key === paper)?.blurb} · Questions are only suggested where genuine exam potential exists.
        </p>
      </header>

      <section aria-labelledby="gs-h">
        <div className="section-head">
          <h2 id="gs-h"><span className="sh-glyph">◆</span>{paper} — current developments</h2>
        </div>
        {paperItems.length ? (
          <div className="grid-cards cols-2">{paperItems.slice(0, 8).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
        ) : (
          <div className="empty">
            <h3>No {paper}-tagged stories in the current archive</h3>
            <p>Tags are applied by the classification pipeline each cycle. Try another paper tab, or check the Prelims facts below.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="pre-h">
        <div className="section-head">
          <h2 id="pre-h"><span className="sh-glyph">✦</span>Prelims Fact Radar</h2>
          <Link className="sh-link" href="/facts">All facts →</Link>
        </div>
        {prelimsItems.length ? (
          <div className="grid-cards cols-2">
            {prelimsItems.slice(0, 6).map((a) => (
              <div key={a.id} className="card">
                <div className="card-top"><span className="badge gs">PRELIMS</span><span className="tag">{a.category}</span></div>
                <h3 className="card-title" style={{ fontSize: 14 }}><Link href={`/article/${a.id}`}>{a.title.replace(/^Sample briefing — /, '')}</Link></h3>
                <div className="card-why">
                  <span className="cw-label">FACT</span>
                  <span>{a.prelims_fact}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">No prelims facts extracted in this window.</p>
        )}
      </section>

      {daily.learning.length > 0 && (
        <section aria-labelledby="learn-h">
          <div className="section-head">
            <h2 id="learn-h"><span className="sh-glyph">🎓</span>Today’s Learning Capsules</h2>
          </div>
          <div className="grid-cards cols-3">
            {daily.learning.map((c) => (
              <div key={c.id} className="card">
                <div className="card-top"><span className="badge gs">CAPSULE</span></div>
                <h3 className="card-title" style={{ fontSize: 14.5 }}>{c.title}</h3>
                <p className="card-summary">{c.body}</p>
                <div className="card-meta">{c.exam_relevance ?? ''}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
