import type { FactCapsule } from '@/lib/types';
import { BookmarkButton } from '@/components/article/BookmarkButton';

const BADGE: Record<string, { cls: string; label: string }> = {
  fact: { cls: 'high', label: 'FACT OF THE DAY' },
  fun: { cls: 'low', label: 'FUN FACT 😄' },
  learning: { cls: 'gs', label: 'LEARNING CAPSULE' },
  tool: { cls: 'medium', label: 'FREE AI TOOL' },
};

export function FactCard({ item, variant, compact = false }: {
  item: FactCapsule;
  variant: 'fact' | 'fun' | 'learning' | 'tool';
  compact?: boolean;
}) {
  const badge = BADGE[variant] ?? BADGE.fact;
  const url = item.meta.url ?? null;

  return (
    <article className={`card${compact ? '' : ' panel'}`} style={compact ? undefined : { padding: 22 }}>
      <div className="card-top">
        <span className={`badge ${badge.cls}`}>{badge.label}</span>
        {item.category && <span className="tag">{item.category}</span>}
        {variant === 'tool' && <span className="tag">FREE</span>}
        <BookmarkButton itemId={item.id} itemType={variant === 'learning' ? 'learning' : variant === 'tool' ? 'tool' : 'fact'} />
      </div>
      <h3 className="card-title" style={{ fontSize: compact ? 14.5 : 16 }}>
        {url ? <a href={url} target="_blank" rel="noopener noreferrer">{item.title} ↗</a> : item.title}
      </h3>
      <p className="card-summary">{item.body}</p>
      {item.why_it_matters && (
        <div className="card-why">
          <span className="cw-label">{variant === 'tool' ? 'WHY STUDENTS' : 'WHY IT MATTERS'}</span>
          <span>{item.why_it_matters}</span>
        </div>
      )}
      {(item.exam_relevance || item.meta.free_limits) && (
        <div className="card-meta">
          {item.exam_relevance && <span>🎓 {item.exam_relevance}</span>}
          {item.meta.free_limits && <span>· Free limits: {item.meta.free_limits}</span>}
        </div>
      )}
    </article>
  );
}
