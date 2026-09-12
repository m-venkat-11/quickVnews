import type { Article } from '@/lib/types';

/** The signature PRISM feature: CURRENT EVENT → STATIC CONCEPT → EXAM RELEVANCE. */
export function ConceptMap({ article }: { article: Article }) {
  if (!article.static_concepts.length && !article.gs_paper) return null;

  return (
    <div className="concept-map" aria-label="UPSC connection map">
      <div className="concept-node">
        <div className="cn-label">CURRENT EVENT</div>
        {article.title.replace(/^Sample briefing — /, '')}
      </div>
      <div className="concept-link" aria-hidden="true" />
      <div className="concept-node dim">
        <div className="cn-label">STATIC CONCEPTS</div>
        {article.static_concepts.length ? (
          <div className="tags" style={{ marginTop: 4 }}>
            {article.static_concepts.map((c) => <span key={c} className="tag">{c}</span>)}
          </div>
        ) : (
          <span className="muted">No strong static linkage for this item.</span>
        )}
      </div>
      <div className="concept-link" aria-hidden="true" />
      <div className="concept-node">
        <div className="cn-label">EXAM RELEVANCE</div>
        <span>
          {article.gs_paper ? <span className="badge gs" style={{ marginRight: 8 }}>{article.gs_paper}</span> : null}
          {article.exam_relevance ?? 'General awareness value.'}
        </span>
        {article.upsc_angle && <p className="small muted" style={{ margin: '6px 0 0' }}>Angle: {article.upsc_angle}</p>}
      </div>
    </div>
  );
}
