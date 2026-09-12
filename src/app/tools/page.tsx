import type { Metadata } from 'next';
import { FactCard } from '@/components/facts/FactCard';
import { factsForDate, allFacts } from '@/lib/db/queries';

export const metadata: Metadata = { title: 'Free AI Tools' };
export const revalidate = 600;

export default async function ToolsPage() {
  const daily = factsForDate();
  const tools = allFacts('tool');

  return (
    <>
      {daily.tool && <FactCard variant="tool" item={daily.tool} />}

      <section aria-labelledby="all-h">
        <div className="section-head">
          <h2 id="all-h"><span className="sh-glyph">🛠️</span>Vetted Free Tools</h2>
          <span className="sh-link">safe, genuinely useful, free-tier friendly</span>
        </div>
        <div className="grid-cards cols-3">
          {tools.map((t) => <FactCard key={t.id} variant="tool" item={t} compact />)}
        </div>
      </section>

      <div className="panel">
        <h3 style={{ margin: '0 0 6px', fontSize: 14 }}>Vetting policy</h3>
        <p className="small muted" style={{ margin: 0 }}>
          Tools are listed only when they are free-tier usable, from reputable providers, and useful for study workflows.
          Unsafe, scammy or misleading tools are never recommended. No referral links, no paid placements.
        </p>
      </div>
    </>
  );
}
