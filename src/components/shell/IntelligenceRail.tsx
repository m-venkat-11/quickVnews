import Link from 'next/link';
import { Icon } from '@/components/icons';
import { factsForDate, listArticles, articleCount } from '@/lib/db/queries';
import type { Article } from '@/lib/types';
import { istDateShort, relTime } from '@/lib/utils/time';

function RailItem({ a }: { a: Article }) {
  return (
    <div className="rail-item">
      <span className="ri-time">{relTime(a.published_at)}</span>
      <Link href={`/article/${a.id}`}>{a.title.length > 86 ? `${a.title.slice(0, 86)}…` : a.title}</Link>
    </div>
  );
}

export function IntelligenceRail() {
  const learning = factsForDate();
  const { items: examItems } = listArticles({ category: 'jobs', pageSize: 4 });
  const { items: alertItems } = listArticles({ priority: 'CRITICAL', pageSize: 3 });

  return (
    <aside className="shell-rail" aria-label="Intelligence panel">
      <div className="rail-block">
        <h3><span className="rb-glyph">◆</span> Exam Radar</h3>
        <div className="rail-list">
          {examItems.length === 0 && <span className="muted small">No recruitment updates in this cycle.</span>}
          {examItems.map((a) => <RailItem key={a.id} a={a} />)}
        </div>
        <Link className="sh-link small muted" href="/topic/jobs" style={{ display: 'inline-block', marginTop: 8 }}>
          All job alerts →
        </Link>
      </div>

      {alertItems.length > 0 && (
        <div className="rail-block">
          <h3><span className="rb-glyph" style={{ color: 'var(--red)' }}>▲</span> Critical Watch</h3>
          <div className="rail-list">
            {alertItems.map((a) => <RailItem key={a.id} a={a} />)}
          </div>
        </div>
      )}

      <div className="rail-block">
        <h3><span className="rb-glyph">◷</span> Upcoming Cycles</h3>
        <div className="rail-list">
          <div className="rail-mini"><span>Next intelligence update</span><b>6h cadence</b></div>
          <div className="rail-mini"><span>Feed slots (IST)</span><b>00 / 06 / 12 / 18</b></div>
          <div className="rail-mini"><span>Today</span><b>{istDateShort(new Date())}</b></div>
        </div>
      </div>

      {learning.fact && (
        <div className="rail-block">
          <h3><span className="rb-glyph">✦</span> Quick Fact</h3>
          <p className="small" style={{ margin: '0 0 6px', color: 'var(--text)' }}>{learning.fact.title}</p>
          <p className="small muted" style={{ margin: 0 }}>{learning.fact.body}</p>
          <Link className="sh-link small muted" href="/facts" style={{ display: 'inline-block', marginTop: 8 }}>
            Fact of the day →
          </Link>
        </div>
      )}

      <div className="rail-block">
        <h3><span className="rb-glyph">≡</span> Feed Status</h3>
        <div className="rail-list">
          <div className="rail-mini"><span>Articles stored</span><b>{articleCount()}</b></div>
          <div className="rail-mini"><span>Next slot</span><b>00/06/12/18 IST</b></div>
        </div>
      </div>
    </aside>
  );
}
