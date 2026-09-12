import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticle, relatedArticles, isBookmarked } from '@/lib/db/queries';
import { getSessionUserId } from '@/lib/session';
import { CATEGORY_BY_SLUG } from '@/lib/config';
import { istFull, relTime } from '@/lib/utils/time';
import { ConceptMap } from '@/components/article/ConceptMap';
import { ExplainToggle } from '@/components/article/ExplainToggle';
import { ArticleCard } from '@/components/article/ArticleCard';
import { DetailBookmark } from '@/components/article/DetailBookmark';
import { ReadTracker } from '@/components/article/ReadTracker';
import { ReviewButton } from '@/components/article/ReviewButton';
import { ShareButton } from '@/components/article/ShareButton';

export const revalidate = 120;

/** Estimate reading time based on content length. */
function readingTime(article: { summary?: string | null; deep_summary?: string | null; background?: string | null; why_it_matters?: string | null }): string {
  const text = [article.summary, article.deep_summary, article.background, article.why_it_matters].filter(Boolean).join(' ');
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/** Source tier badge */
function TierBadge({ tier }: { tier: number }) {
  const stars = tier === 1 ? '★★★' : tier === 2 ? '★★' : '★';
  const label = tier === 1 ? 'Official' : tier === 2 ? 'Reputable' : 'General';
  const color = tier === 1 ? 'var(--green)' : tier === 2 ? 'var(--accent-2)' : 'var(--muted)';
  return (
    <span title={`Tier ${tier} — ${label} source`} style={{ color, fontSize: 11, letterSpacing: '0.04em' }}>
      {stars}
    </span>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = getArticle(id);
  if (!article) return { title: 'Article not found' };
  return {
    title: article.title,
    description: article.quick_summary ?? article.summary ?? undefined,
    openGraph: {
      title: article.title,
      description: article.quick_summary ?? article.summary ?? undefined,
      type: 'article',
      publishedTime: article.published_at,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = getArticle(id);
  if (!article) notFound();

  const userId = await getSessionUserId();
  const related = relatedArticles(article, 3);
  const cat = CATEGORY_BY_SLUG[article.category];
  const fact = article.key_facts[0];

  return (
    <article style={{ maxWidth: 860 }}>
      <ReadTracker articleId={article.id} />

      <div className="article-hero">
        <div className="card-top">
          <span className={`badge ${article.priority.toLowerCase()}`}>{article.priority}</span>
          <span className="tag">{cat?.label ?? article.category}</span>
          {article.gs_paper && <span className="badge gs">{article.gs_paper}</span>}
          {article.is_demo === 1 && <span className="badge sample">SAMPLE</span>}
          <TierBadge tier={article.source_tier} />
        </div>
        <h1>{article.title.replace(/^Sample briefing — /, '')}</h1>
        <div className="card-meta">
          <span>{istFull(article.published_at)} IST</span>
          <span className="dotsep">•</span>
          <span>{relTime(article.published_at)}</span>
          <span className="dotsep">•</span>
          <span>{readingTime(article)}</span>
          <span className="dotsep">•</span>
          <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="src">{article.source_name.replace(/ \(sample\)$/, '')}</a>
          <span className="dotsep">•</span>
          <span>{article.ai_processed === 1 ? 'AI summarized' : 'Heuristic pipeline'}</span>
        </div>
      </div>

      <div className="mt-4" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <ExplainToggle article={article} />
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <ReviewButton itemId={article.id} />
          <ShareButton title={article.title} url={`/article/${article.id}`} summary={article.quick_summary} />
        </div>
      </div>

      <section className="article-section">
        <h3>What Happened?</h3>
        <p>{article.what_happened ?? article.summary}</p>
      </section>

      {article.background && (
        <section className="article-section">
          <h3>Background</h3>
          <p>{article.background}</p>
        </section>
      )}

      {article.why_it_matters && (
        <section className="article-section">
          <h3>Why It Matters</h3>
          <p>{article.why_it_matters}</p>
        </section>
      )}

      {article.key_facts.length > 0 && (
        <section className="article-section">
          <h3>Key Facts</h3>
          <ul>
            {article.key_facts.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </section>
      )}

      {article.india_angle && (
        <section className="article-section">
          <h3>India Angle</h3>
          <p>{article.india_angle}</p>
        </section>
      )}

      {article.prelims_fact && (
        <section className="article-section">
          <h3>Potential Prelims Fact</h3>
          <div className="card-why">
            <span className="cw-label">PRELIMS</span>
            <span>{article.prelims_fact}</span>
          </div>
        </section>
      )}

      <section className="article-section">
        <h3>UPSC Connection Map</h3>
        <ConceptMap article={article} />
      </section>

      <section className="article-section">
        <h3>Related Topics</h3>
        <div className="tags">
          {article.keywords.map((k) => <span key={k} className="tag">{k}</span>)}
          {article.entities.map((e) => <span key={e} className="tag">{e}</span>)}
          {article.countries.map((c) => <span key={c} className="tag">{c}</span>)}
        </div>
      </section>

      <section className="article-section">
        <h3>Original Sources</h3>
        <div className="kv">
          <dt>Primary source</dt>
          <dd>
            <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="underline">{article.source_name.replace(/ \(sample\)$/, '')}</a>
            {' '}<TierBadge tier={article.source_tier} />
          </dd>
          <dt>Confidence</dt>
          <dd>{article.confidence ?? 'source-verified'}{article.sources.length > 1 ? ` · ${article.sources.length} sources reporting` : ''}</dd>
          <dt>AI processing</dt>
          <dd>{article.ai_processed === 1 ? 'LLM-processed' : 'Deterministic pipeline (no LLM key set)'}</dd>
        </div>
        {article.sources.length > 1 && (
          <ul style={{ marginTop: 8 }}>
            {article.sources.map((s, i) => (
              <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a></li>
            ))}
          </ul>
        )}
      </section>

      <DetailBookmark articleId={article.id} />

      <section aria-labelledby="rel-h" className="mt-4">
        <div className="section-head">
          <h2 id="rel-h" style={{ fontSize: 15 }}>Related Articles</h2>
        </div>
        <div className="grid-cards cols-3">
          {related.map((a) => <ArticleCard key={a.id} article={a} showWhy={false} />)}
        </div>
      </section>
    </article>
  );
}
