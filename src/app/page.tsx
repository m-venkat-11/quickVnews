import Link from 'next/link';
import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/AppShell';
import { ArticleCard, ArticleRow } from '@/components/article/ArticleCard';
import { HeroStatus } from '@/components/home/HeroStatus';
import {
  listArticles, topDevelopments, factsForDate, getBriefing, latestRun,
} from '@/lib/db/queries';
import { APP, UPDATE_SLOTS_IST } from '@/lib/config';
import { istDateKey, istDate, countdown, nextUpdateAt } from '@/lib/utils/time';

export const metadata: Metadata = {
  title: APP.seoTitle,
  description: APP.description,
};

// Revalidate sections every 5 min; ingestion refreshes data on its own schedule.
export const revalidate = 300;

function Section({
  id, title, glyph, href, children,
}: { id: string; title: string; glyph: string; href: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`}>
      <div className="section-head">
        <h2 id={`${id}-h`}><span className="sh-glyph">{glyph}</span>{title}</h2>
        <Link className="sh-link" href={href}>View all →</Link>
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const run = latestRun();
  const top = topDevelopments(8, run?.id);
  const fallback = top.length === 0;

  const pick = (cats: string[], n: number) =>
    listArticles({ category: cats[0], pageSize: n }).items;

  const india = listArticles({ category: 'india', pageSize: 6 }).items;
  const world = listArticles({ category: 'world', pageSize: 6 }).items;
  const ap = listArticles({ category: 'ap', pageSize: 6 }).items;
  const vizag = listArticles({ category: 'vizag', pageSize: 6 }).items;
  const economy = listArticles({ category: 'economy', pageSize: 6 }).items;
  const sciAi = [...listArticles({ category: 'ai', pageSize: 3 }).items, ...listArticles({ category: 'science', pageSize: 3 }).items];
  const defence = listArticles({ category: 'defence', pageSize: 6 }).items;
  const environment = listArticles({ category: 'environment', pageSize: 4 }).items;
  const government = listArticles({ category: 'government', pageSize: 4 }).items;
  const jobs = listArticles({ category: 'jobs', pageSize: 4 }).items;
  const upscRadar = listArticles({ category: 'upsc', pageSize: 4 }).items;

  const daily = factsForDate();
  const briefing = getBriefing();

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="hero" aria-labelledby="hero-h">
        <span className="hero-kicker">
          <span className="dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block', animation: 'pulse 2.4s infinite' }} />
          Intelligence Feed Active
        </span>
        <h1 id="hero-h">Your World. <span className="grad">Simplified.</span></h1>
        <p>{APP.subtitle}</p>
        <div className="hero-actions">
          <Link className="btn primary" href="/brief">Read Today’s Briefing</Link>
          <Link className="btn ghost" href="#india">Explore Topics</Link>
        </div>
        <HeroStatus
          lastUpdated={run?.finished_at ?? run?.started_at ?? null}
          nextUpdate={nextUpdateAt()}
          slotInfo={`Cycles run ${UPDATE_SLOTS_IST.join(' · ')} IST`}
        />
      </section>

      {/* ---------------- TOP DEVELOPMENTS ---------------- */}
      <section aria-labelledby="top-h">
        <div className="section-head">
          <h2 id="top-h"><span className="sh-glyph">⚡</span>Top Developments</h2>
          <span className="sh-link">latest 6-hour window · AI-ranked</span>
        </div>
        {fallback ? (
          <div className="empty">
            <h3>Intelligence update in progress</h3>
            <p>The next 6-hour cycle is being processed. Last successful update: check the header clock. Demo cycles fill in automatically.</p>
          </div>
        ) : (
          <div className="grid-cards cols-2">
            {top.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </section>

      {/* ---------------- CATEGORY SECTIONS ---------------- */}
      <Section id="india" title="India — National" glyph="🇮🇳" href="/topic/india">
        {india.length ? <div className="grid-cards cols-2">{india.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No India items in this window yet.</p>}
      </Section>

      <Section id="world" title="World & Geopolitics" glyph="🌍" href="/topic/world">
        {world.length ? <div className="grid-cards cols-2">{world.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No world items in this window yet.</p>}
      </Section>

      <Section id="ap" title="Andhra Pradesh" glyph="📍" href="/topic/ap">
        {ap.length ? <div className="grid-cards cols-2">{ap.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No AP items in this window yet.</p>}
      </Section>

      <Section id="vizag" title="Vizag Intelligence" glyph="⚓" href="/topic/visakhapatnam">
        {vizag.length ? <div className="grid-cards cols-2">{vizag.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No Visakhapatnam items in this window yet.</p>}
      </Section>

      <Section id="economy" title="Indian Economy" glyph="💰" href="/topic/economy">
        {economy.length ? <div className="grid-cards cols-2">{economy.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No economy items in this window yet.</p>}
      </Section>

      <Section id="science-ai" title="Science & AI" glyph="🤖" href="/topic/ai">
        {sciAi.length ? <div className="grid-cards cols-2">{sciAi.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No science/AI items in this window yet.</p>}
      </Section>

      <Section id="defence" title="Defence & Security" glyph="🛡️" href="/topic/defence">
        {defence.length ? <div className="grid-cards cols-2">{defence.slice(0, 4).map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No defence items in this window yet.</p>}
      </Section>

      <Section id="environment" title="Environment & Climate" glyph="🌱" href="/topic/environment">
        {environment.length ? <div className="grid-cards cols-2">{environment.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
          : <p className="muted small">No environment items in this window yet.</p>}
      </Section>

      <Section id="government" title="Government Schemes" glyph="🏛️" href="/topic/government">
        {government.length ? <div className="grid-cards cols-3">{government.map((a) => <ArticleRow key={a.id} article={a} />)}</div>
          : <p className="muted small">No government items in this window yet.</p>}
      </Section>

      <Section id="jobs" title="Government Jobs & Recruitment" glyph="💼" href="/topic/jobs">
        {jobs.length ? <div className="grid-cards cols-2">{jobs.map((a) => <ArticleCard key={a.id} article={a} showWhy={false} />)}</div>
          : <p className="muted small">No recruitment updates in this window yet.</p>}
      </Section>

      {/* ---------------- UPSC RADAR STRIP ---------------- */}
      <section id="upsc-strip" aria-labelledby="upscstrip-h" className="panel">
        <div className="section-head">
          <h2 id="upscstrip-h"><span className="sh-glyph">📚</span>UPSC / APPSC Radar</h2>
          <Link className="sh-link" href="/upsc">Open exam dashboard →</Link>
        </div>
        {upscRadar.length ? (
          <div className="grid-cards cols-2">
            {upscRadar.slice(0, 2).map((a) => <ArticleRow key={a.id} article={a} />)}
            <div className="rail-mini" style={{ alignItems: 'center' }}>
              <span className="muted small">GS-tagged items in the last 7 days:</span>
              <b className="mono">
                {listArticles({ pageSize: 60 }).items.filter((a) => a.gs_paper).length}
              </b>
            </div>
          </div>
        ) : (
          <p className="muted small">Run the ingestion cycle to populate the exam radar.</p>
        )}
      </section>

      {/* ---------------- TODAY'S LEARNING / FACTS / TOOLS / FUN ---------------- */}
      <section aria-labelledby="learning-h">
        <div className="section-head">
          <h2 id="learning-h"><span className="sh-glyph">🎓</span>Today’s Learning</h2>
          <Link className="sh-link" href="/facts">All capsules →</Link>
        </div>
        <div className="grid-cards cols-3">
          {daily.learning.length ? daily.learning.map((c) => (
            <div key={c.id} className="card">
              <div className="card-top"><span className="badge gs">CAPSULE</span>{c.category && <span className="tag">{c.category}</span>}</div>
              <h3 className="card-title" style={{ fontSize: 14.5 }}>{c.title}</h3>
              <p className="card-summary">{c.body}</p>
              <div className="card-meta">{c.exam_relevance ? `🎓 ${c.exam_relevance}` : ''}</div>
            </div>
          )) : <p className="muted small">Capsules rotate in with each update cycle.</p>}
        </div>
      </section>

      <div className="grid-cards cols-3">
        {daily.fact && (
          <div className="card">
            <div className="card-top"><span className="badge high">FACT OF THE DAY</span>{daily.fact.category && <span className="tag">{daily.fact.category}</span>}</div>
            <h3 className="card-title" style={{ fontSize: 14.5 }}>{daily.fact.title}</h3>
            <p className="card-summary">{daily.fact.body}</p>
            <div className="card-meta">{daily.fact.exam_relevance ?? ''}</div>
          </div>
        )}
        {daily.tool && (
          <div className="card">
            <div className="card-top"><span className="badge medium">AI TOOL OF THE DAY</span></div>
            <h3 className="card-title" style={{ fontSize: 14.5 }}>
              <a href={daily.tool.meta.url ?? '#'} target="_blank" rel="noopener noreferrer">{daily.tool.title}</a>
            </h3>
            <p className="card-summary">{daily.tool.body}</p>
            <div className="card-meta">Best for: {daily.tool.meta.best_for ?? 'students'} · Free limits: {daily.tool.meta.free_limits ?? 'generous'}</div>
          </div>
        )}
        {daily.fun && (
          <div className="card">
            <div className="card-top"><span className="badge low">FUN FACT 😄</span>{daily.fun.category && <span className="tag">{daily.fun.category}</span>}</div>
            <h3 className="card-title" style={{ fontSize: 14.5 }}>{daily.fun.title}</h3>
            <p className="card-summary">{daily.fun.body}</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <span>© {new Date().getFullYear()} {APP.name} — {APP.tagline}</span>
        <span>
          News → AI → Context → Exam Relevance → Revision · Updates every 6h ({UPDATE_SLOTS_IST.join('/')} IST)
          {briefing ? ` · Brief ready for ${briefing.date}` : ''}
        </span>
      </footer>
    </>
  );
}
