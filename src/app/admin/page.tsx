import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isAdminRequest } from '@/lib/admin';
import { db } from '@/lib/db/index';
import { latestRun, sourceStats, articleCount } from '@/lib/db/queries';
import { AdminActions } from '@/components/admin/AdminActions';
import { nextUpdateAt, istFull, relTime } from '@/lib/utils/time';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const h = await headers();
  if (!isAdminRequest(h)) notFound();

  const run = latestRun();
  const stats = sourceStats();
  const total = articleCount();
  const runs = db().prepare('SELECT * FROM update_runs ORDER BY started_at DESC LIMIT 10').all() as Record<string, unknown>[];
  const sources = db().prepare('SELECT name, tier, enabled, fail_count, last_status, last_fetched_at FROM sources ORDER BY tier, name').all() as Record<string, unknown>[];
  const demoCount = (db().prepare('SELECT COUNT(*) AS c FROM articles WHERE is_demo = 1').get() as { c: number }).c;

  return (
    <div style={{ maxWidth: 980 }}>
      <header className="panel">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">🛠</span>Update Engine — Debug</h2>
          <span className="sh-link mono">next slot {istFull(nextUpdateAt())} IST</span>
        </div>
        <div className="stat-tiles mt-3">
          <div className="stat-tile"><div className="st-label">Last update</div><div className="st-value">{run ? relTime(run.finished_at ?? run.started_at) : '—'}</div></div>
          <div className="stat-tile"><div className="st-label">Status</div><div className={`st-value ${run?.status === 'success' ? 'good' : run?.status === 'partial' || run?.status === 'failed' ? 'warn' : ''}`}>{run?.status ?? 'none'}</div></div>
          <div className="stat-tile"><div className="st-label">Mode</div><div className="st-value">{run?.mode ?? 'demo'}</div></div>
          <div className="stat-tile"><div className="st-label">Articles stored</div><div className="st-value">{total}</div></div>
          <div className="stat-tile"><div className="st-label">Sample articles</div><div className="st-value warn">{demoCount}</div></div>
          <div className="stat-tile"><div className="st-label">Sources enabled</div><div className="st-value good">{stats.enabled}/{stats.total}</div></div>
        </div>
        {run?.notes && <p className="small muted mt-2" style={{ margin: 0 }}>Notes: {run.notes}</p>}
        <AdminActions />
      </header>

      <section className="panel mt-3">
        <div className="section-head"><h2 style={{ fontSize: 15 }}>Recent Update Runs</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Run</th><th>Started</th><th className="num">Fetched</th><th className="num">Dupes</th><th className="num">Processed</th><th className="num">High-pri</th><th className="num">Failed src</th><th>Status</th><th>Mode</th></tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={String(r.id)}>
                  <td className="mono small">{String(r.id).slice(4, 24)}</td>
                  <td>{istFull(String(r.started_at))}</td>
                  <td className="num">{String(r.fetched)}</td>
                  <td className="num">{String(r.duplicates)}</td>
                  <td className="num">{String(r.processed)}</td>
                  <td className="num">{String(r.high_priority)}</td>
                  <td className="num">{String(r.failed_sources)}</td>
                  <td>{String(r.status)}</td>
                  <td>{String(r.mode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel mt-3">
        <div className="section-head"><h2 style={{ fontSize: 15 }}>Source Health</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Source</th><th className="num">Tier</th><th>Enabled</th><th className="num">Fails</th><th>Last status</th><th>Last fetch</th></tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={String(s.name)}>
                  <td>{String(s.name)}</td>
                  <td className="num">{String(s.tier)}</td>
                  <td>{Number(s.enabled) === 1 ? '✓' : '✗'}</td>
                  <td className="num">{String(s.fail_count)}</td>
                  <td className="small">{String(s.last_status ?? '—')}</td>
                  <td className="small">{s.last_fetched_at ? istFull(String(s.last_fetched_at)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
