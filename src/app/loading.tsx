export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading intelligence feed">
      <div className="skeleton" style={{ height: 180, borderRadius: 16, marginBottom: 22 }} />
      <div className="grid-cards cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 170, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}
