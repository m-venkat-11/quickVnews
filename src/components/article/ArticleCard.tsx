import Link from 'next/link';
import type { Article } from '@/lib/types';
import { CATEGORY_BY_SLUG } from '@/lib/config';
import { relTime } from '@/lib/utils/time';
import { truncate } from '@/lib/utils/text';
import { BookmarkButton } from './BookmarkButton';

function ConfidenceLabel({ article }: { article: Article }) {
  const c = article.confidence;
  if (!c) return null;
  const map: Record<string, string> = {
    official: 'Official source',
    'multi-source': 'Multiple sources',
    'source-verified': 'Source verified',
    developing: 'Developing story',
    'reports-differ': 'Reports differ',
  };
  return <span className={`confidence ${c}`} title={map[c]}>✓ {map[c]}</span>;
}

export function ArticleCard({ article, showWhy = true, isRead = false }: { article: Article; showWhy?: boolean; isRead?: boolean }) {
  const cat = CATEGORY_BY_SLUG[article.category];
  const fact = article.key_facts[0];

  return (
    <article className={`card${article.priority === 'CRITICAL' ? ' critical' : ''}`}>
      <div className="card-top">
        <span className={`badge ${article.priority.toLowerCase()}`}>{article.priority}</span>
        <span className="tag">
          {cat?.short ?? article.category}
          {article.subcategory ? ` • ${article.subcategory}` : ''}
        </span>
        {article.gs_paper && <span className="badge gs">{article.gs_paper}</span>}
        {isRead && <span className="tag" style={{ color: 'var(--green)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>✓ Read</span>}
        {article.is_demo === 1 && <span className="badge sample" title="Sample content — replace with live sources">SAMPLE</span>}
        <BookmarkButton itemId={article.id} />
      </div>

      <h3 className="card-title">
        <Link href={`/article/${article.id}`}>{article.title.replace(/^Sample briefing — /, '')}</Link>
      </h3>

      <p className="card-summary">{article.quick_summary || article.summary}</p>

      {showWhy && article.why_it_matters && (
        <div className="card-why">
          <span className="cw-label">WHY IT MATTERS</span>
          <span>{article.why_it_matters}</span>
        </div>
      )}

      {(article.exam_relevance || fact) && (
        <div className="tags" style={{ marginBottom: 10 }}>
          {article.exam_relevance && <span className="tag" title={article.exam_relevance}>🎓 {article.exam_relevance.split('—')[0].trim()}</span>}
          {fact && <span className="tag" title={fact}>◆ Key fact: {truncate(fact, 60)}</span>}
        </div>
      )}

      <div className="card-meta">
        <span>{relTime(article.published_at)}</span>
        <span className="dotsep">•</span>
        <span style={{ color: article.source_tier === 1 ? 'var(--green)' : article.source_tier === 2 ? 'var(--accent-2)' : 'var(--muted)', fontSize: 10 }}>
          {article.source_tier === 1 ? '★★★' : article.source_tier === 2 ? '★★' : '★'}
        </span>
        <a className="src" href={article.source_url} target="_blank" rel="noopener noreferrer">
          {article.source_name.replace(/ \(sample\)$/, '')}
        </a>
        <span className="dotsep">•</span>
        <ConfidenceLabel article={article} />
        <span className="dotsep">•</span>
        <span>{Math.max(1, Math.ceil([article.summary, article.why_it_matters].filter(Boolean).join(' ').split(/\s+/).length / 200))} min</span>
        {article.region && article.region !== 'India' && (
          <>
            <span className="dotsep">•</span>
            <span>{article.region}</span>
          </>
        )}
      </div>
    </article>
  );
}

export function ArticleRow({ article }: { article: Article }) {
  const cat = CATEGORY_BY_SLUG[article.category];
  return (
    <article className="card" style={{ padding: '12px 14px' }}>
      <div className="card-top" style={{ marginBottom: 4 }}>
        <span className={`badge ${article.priority.toLowerCase()}`}>{article.priority}</span>
        <span className="tag">{cat?.short ?? article.category}</span>
        {article.is_demo === 1 && <span className="badge sample">SAMPLE</span>}
        <BookmarkButton itemId={article.id} />
      </div>
      <h3 className="card-title" style={{ fontSize: 14 }}>
        <Link href={`/article/${article.id}`}>{article.title.replace(/^Sample briefing — /, '')}</Link>
      </h3>
      <div className="card-meta">
        <span>{relTime(article.published_at)}</span>
        <span className="dotsep">•</span>
        <span>{article.source_name.replace(/ \(sample\)$/, '')}</span>
        {article.gs_paper && (
          <>
            <span className="dotsep">•</span>
            <span className="badge gs">{article.gs_paper}</span>
          </>
        )}
      </div>
    </article>
  );
}
