import type { Metadata } from 'next';
import { FactCard } from '@/components/facts/FactCard';
import { factsForDate, allFacts } from '@/lib/db/queries';

export const metadata: Metadata = { title: 'Facts & Learning' };
export const revalidate = 300;

export default async function FactsPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const daily = factsForDate();
  const kind = ['fact', 'fun', 'learning', 'tool'].includes(sp.kind ?? '') ? sp.kind! : undefined;
  const archive = allFacts(kind).filter((f) => f.kind !== 'tool' || kind === 'tool').slice(0, 24);

  return (
    <>
      {daily.fact && <FactCard variant="fact" item={daily.fact} />}
      {daily.fun && <FactCard variant="fun" item={daily.fun} />}
      {daily.tool && <FactCard variant="tool" item={daily.tool} />}

      {daily.learning.length > 0 && (
        <section aria-labelledby="dl-h">
          <div className="section-head">
            <h2 id="dl-h"><span className="sh-glyph">🎓</span>Today’s Learning Capsules</h2>
          </div>
          <div className="grid-cards cols-3">
            {daily.learning.map((c) => <FactCard key={c.id} variant="learning" item={c} compact />)}
          </div>
        </section>
      )}

      <section aria-labelledby="arch-h">
        <div className="section-head">
          <h2 id="arch-h"><span className="sh-glyph">≡</span>Archive</h2>
          <div className="chips">
            {['', 'fact', 'learning', 'fun'].map((k) => (
              <a key={k || 'all'} className={`chip${(kind ?? '') === k ? ' active' : ''}`} href={`/facts${k ? `?kind=${k}` : ''}`}>
                {k === '' ? 'All' : k === 'fact' ? 'Facts' : k === 'learning' ? 'Capsules' : 'Fun'}
              </a>
            ))}
          </div>
        </div>
        <div className="grid-cards cols-3">
          {archive.map((f) => <FactCard key={f.id} variant={f.kind} item={f} compact />)}
        </div>
      </section>
    </>
  );
}
