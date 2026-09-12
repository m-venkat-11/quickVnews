import type { Metadata } from 'next';
import { RevisionDeck, type DeckCard } from '@/components/revision/RevisionDeck';
import { listArticles, bookmarkedArticles, factsForDate, getDueReviews, reviewStats, getArticle } from '@/lib/db/queries';
import { getSessionUserId } from '@/lib/session';

export const metadata: Metadata = { title: 'Revision & Spaced Repetition' };
export const dynamic = 'force-dynamic';

export default async function RevisionPage() {
  const userId = await getSessionUserId();
  const saved = bookmarkedArticles(userId);
  const stats = reviewStats(userId);
  const dueReviews = getDueReviews(userId);

  const dueCards: DeckCard[] = [];
  for (const r of dueReviews) {
    if (r.item_type === 'article') {
      const a = getArticle(r.item_id);
      if (a) {
        const org = a.key_facts.find((f) => /\b(organization|organisation|ministry|commission|bank|court|WHO|UN|RBI|SEBI|ISRO|DRDO)\b/i.test(f));
        dueCards.push({
          id: a.id,
          itemType: 'article',
          question: org ? `Which organization is central to this development — “${a.title.replace(/^Sample briefing — /, '')}”?` : `What happened: ${a.title.replace(/^Sample briefing — /, '')}?`,
          answer: org ?? (a.quick_summary ?? a.summary ?? ''),
          why: a.why_it_matters,
          source: a.source_name.replace(/ \(sample\)$/, ''),
          href: `/article/${a.id}`,
          isDue: true,
          interval: r.interval_days,
          reps: r.repetitions,
          easeFactor: r.ease_factor,
        });
      }
    }
  }

  const { items: topItems } = listArticles({ pageSize: 14 });
  const daily = factsForDate();
  const allCards: DeckCard[] = [];

  for (const a of [...saved, ...topItems]) {
    if (allCards.some((c) => c.id === a.id)) continue;
    const org = a.key_facts.find((f) => /\b(organization|organisation|ministry|commission|bank|court|WHO|UN|RBI|SEBI|ISRO|DRDO)\b/i.test(f));
    allCards.push({
      id: a.id,
      itemType: 'article',
      question: org ? `Which organization is central to this development — “${a.title.replace(/^Sample briefing — /, '')}”?` : `What happened: ${a.title.replace(/^Sample briefing — /, '')}?`,
      answer: org ?? (a.quick_summary ?? a.summary ?? ''),
      why: a.why_it_matters,
      source: a.source_name.replace(/ \(sample\)$/, ''),
      href: `/article/${a.id}`,
    });
  }

  for (const c of daily.learning) {
    allCards.push({
      id: c.id,
      itemType: 'fact',
      question: c.title.replace(/^Understand: /, 'Explain: '),
      answer: c.body ?? '',
      why: c.why_it_matters,
      source: 'Learning capsule',
      href: '/facts',
    });
  }

  return (
    <>
      <header className="panel">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">🧠</span>Revision & Spaced Repetition</h2>
          <span className="sh-link">{stats.due} due · {allCards.length} in deck</span>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Master current affairs with SM-2 spaced repetition. Rate how well you recall each item to schedule future reviews at optimal retention intervals.
        </p>
      </header>
      <RevisionDeck dueCards={dueCards} allCards={allCards} stats={stats} />
    </>
  );
}
