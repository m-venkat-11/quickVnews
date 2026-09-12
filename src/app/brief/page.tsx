import Link from 'next/link';
import type { Metadata } from 'next';
import { getBriefing, latestRun, getArticle } from '@/lib/db/queries';
import { istDate, istWeekday, istFull } from '@/lib/utils/time';
import { APP } from '@/lib/config';

export const metadata: Metadata = { title: 'Daily Intelligence Brief' };
export const dynamic = 'force-dynamic';

export default async function BriefPage() {
  const briefing = getBriefing();
  const run = latestRun();

  return (
    <>
      <section className="brief-hero">
        <span className="hero-kicker">DAILY INTELLIGENCE BRIEF</span>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(24px, 3.4vw, 34px)' }}>
          {istWeekday(new Date())}, {istDate(new Date())}
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          {briefing
            ? `Generated ${istFull(briefing.generated_at)} IST from update cycle ${briefing.run_id?.slice(0, 24) ?? '—'}`
            : 'The first briefing is generated at the end of the next update cycle.'}
          {run?.mode === 'demo' || briefing === null ? '' : ''}
        </p>
        <div className="hero-actions mt-3">
          <Link className="btn ghost" href="/">← Back to feed</Link>
          <Link className="btn primary" href="/revision">Start Revision Mode</Link>
        </div>
      </section>

      {!briefing ? (
        <div className="empty">
          <h3>Intelligence update in progress</h3>
          <p>No briefing stored yet. The update engine writes one after every 6-hour cycle — run <code>npm run db:init</code> to generate the first one now.</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="hl-h">
            <div className="section-head">
              <h2 id="hl-h"><span className="sh-glyph">⚡</span>Today’s Most Important Developments</h2>
            </div>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {briefing.headlines.map((h, i) => (
                <li key={i} style={{ color: 'var(--text)', fontSize: 15 }}>{h.replace(/^Sample briefing — /, '')}</li>
              ))}
            </ol>
          </section>

          {briefing.sections.map((section) => (
            <section key={section.key} aria-label={section.title}>
              <div className="section-head">
                <h2 style={{ fontSize: 15 }}><span className="sh-glyph">◆</span>{section.title}</h2>
              </div>
              <div className="grid-cards cols-2">
                {section.articleIds.map((aid) => {
                  const a = getArticle(aid);
                  return a ? (
                    <Link key={aid} href={`/article/${aid}`} className="card" style={{ display: 'block' }}>
                      <h3 className="card-title" style={{ fontSize: 14 }}>{a.title.replace(/^Sample briefing — /, '')}</h3>
                      <p className="card-summary" style={{ marginBottom: 0 }}>{a.quick_summary ?? a.summary}</p>
                    </Link>
                  ) : null;
                })}
              </div>
            </section>
          ))}

          <section className="panel" aria-labelledby="rem-h" style={{ borderColor: 'color-mix(in srgb, var(--amber) 35%, var(--line-soft))' }}>
            <div className="section-head">
              <h2 id="rem-h"><span className="sh-glyph" style={{ color: 'var(--amber)' }}>✦</span>5 Things You Should Remember Today</h2>
            </div>
            <div className="remember-list">
              {briefing.remember.map((r, i) => <div key={i} className="remember-item">{r.replace(/^Sample briefing — /, '')}</div>)}
            </div>
          </section>
        </>
      )}
    </>
  );
}
