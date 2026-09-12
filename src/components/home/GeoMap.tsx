import Link from 'next/link';

/**
 * Geopolitical map — deliberately lightweight (no heavy map library).
 * Country "nodes" sized by current-event intensity; click filters the topic feed.
 */
export function GeoMap({ counts, articlesByCountry }: {
  counts: Record<string, number>;
  articlesByCountry: Record<string, { id: string; title: string }[]>;
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, c]) => c));

  return (
    <section className="panel" aria-label="Geopolitical map">
      <div className="section-head">
        <h2><span className="sh-glyph">🗺️</span>Geopolitical Heat — countries in current coverage</h2>
        <span className="sh-link">click a country to filter</span>
      </div>
      <div className="chips" style={{ gap: 9 }}>
        {entries.map(([country, count]) => {
          const intensity = count / max;
          const size = 13 + intensity * 9;
          return (
            <span
              key={country}
              className="tag"
              style={{
                fontSize: size * 0.62,
                padding: `${size * 0.35}px ${size * 0.8}px`,
                background: `color-mix(in srgb, var(--accent) ${Math.round(8 + intensity * 22)}%, var(--panel-2))`,
                borderColor: `color-mix(in srgb, var(--accent) ${Math.round(intensity * 45)}%, var(--line-soft))`,
              }}
            >
              {country} · {count}
            </span>
          );
        })}
        {entries.length === 0 && <span className="muted small">No country-tagged stories in the current window.</span>}
      </div>

      {entries.length > 0 && (
        <div className="mt-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {entries.slice(0, 4).map(([country, count]) => (
            <div key={country} className="rail-block" style={{ marginBottom: 0 }}>
              <h3>{country} — {count} item{count === 1 ? '' : 's'}</h3>
              <div className="rail-list">
                {(articlesByCountry[country] ?? []).slice(0, 3).map((a) => (
                  <div className="rail-item" key={a.id}>
                    <Link href={`/article/${a.id}`}>{a.title.length > 80 ? `${a.title.slice(0, 80)}…` : a.title}</Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default GeoMap;
