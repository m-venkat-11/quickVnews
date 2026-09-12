'use client';

import { useState } from 'react';

export function AdminActions() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [demo, setDemo] = useState(true);

  const trigger = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(`/api/cron?mode=${demo ? 'demo' : 'live'}`, { method: 'POST' });
      const data = (await res.json()) as Record<string, unknown>;
      setMsg(res.ok
        ? `Run ${String(data.runId ?? '')} → ${String(data.status)} · processed ${String(data.processed)} · duplicates ${String(data.duplicates)}`
        : `Failed: ${String(data.error ?? res.status)}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <label className="small muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
        demo mode (offline)
      </label>
      <button type="button" className="btn primary" onClick={trigger} disabled={busy}>
        {busy ? 'Running…' : 'Run update cycle now'}
      </button>
      <code className="small muted">curl -X POST -H &quot;Authorization: Bearer $CRON_SECRET&quot; /api/cron</code>
      {msg && <span className="small" style={{ color: 'var(--accent)' }}>{msg}</span>}
    </div>
  );
}
