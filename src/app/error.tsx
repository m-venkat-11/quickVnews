'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="empty" style={{ minHeight: 300, justifyContent: 'center' }}>
      <span className="e-icon" style={{ fontSize: 34 }}>⚠</span>
      <h3>Something interrupted the feed</h3>
      <p>
        The intelligence panel couldn’t complete this request. Your last cached briefing is still available offline —
        or retry now.
      </p>
      <code className="small muted">{error.message.slice(0, 140)}</code>
      <button type="button" className="btn primary mt-2" onClick={reset}>Retry</button>
    </div>
  );
}
