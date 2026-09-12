'use client';

import { useState } from 'react';
import type { Article } from '@/lib/types';

type Level = 'quick' | 'standard' | 'deep';

const LABELS: Record<Level, string> = { quick: 'QUICK', standard: 'STANDARD', deep: 'DEEP' };

export function ExplainToggle({ article }: { article: Article }) {
  const [level, setLevel] = useState<Level>('standard');

  const body =
    level === 'quick' ? (article.quick_summary ?? article.summary)
    : level === 'standard' ? (article.summary ?? article.quick_summary)
    : (article.deep_summary ?? article.summary);

  return (
    <div className="article-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>AI Explanation</h3>
        <div className="level-toggle" role="tablist" aria-label="Explanation depth">
          {(Object.keys(LABELS) as Level[]).map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={level === l}
              className={level === l ? 'active' : ''}
              onClick={() => setLevel(l)}
            >
              {LABELS[l]}
            </button>
          ))}
        </div>
      </div>
      <p className="prose-lead" style={{ marginTop: 12 }}>{body ?? 'Summary unavailable.'}</p>

      {article.simple_explanation && (
        <div className="card-why" style={{ marginTop: 12 }}>
          <span className="cw-label">SIMPLY PUT</span>
          <span>{article.simple_explanation}</span>
        </div>
      )}
      <p className="small muted" style={{ margin: '8px 0 0' }}>
        {level === 'quick' ? '30-second version.' : level === 'standard' ? 'The 2-minute read.' : 'Full background and implications.'}
        {' '}AI summarized from the linked source — always cross-check the original.
      </p>
    </div>
  );
}
