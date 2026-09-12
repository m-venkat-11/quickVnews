import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty" style={{ minHeight: 320, justifyContent: 'center' }}>
      <span className="e-icon" style={{ fontSize: 34 }}>◇</span>
      <h3>Signal lost — page not found</h3>
      <p>The page you requested is outside the current intelligence perimeter.</p>
      <Link className="btn primary mt-2" href="/">Return to the dashboard</Link>
    </div>
  );
}
