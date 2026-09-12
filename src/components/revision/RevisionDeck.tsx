'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';

export interface DeckCard {
  id: string;
  itemType?: string;
  question: string;
  answer: string;
  why: string | null;
  source: string;
  href: string;
  isDue?: boolean;
  interval?: number;
  reps?: number;
  easeFactor?: number;
}

interface RevisionDeckProps {
  dueCards: DeckCard[];
  allCards: DeckCard[];
  stats: { total: number; due: number; mastered: number };
}

export function RevisionDeck({ dueCards: initialDueCards, allCards, stats }: RevisionDeckProps) {
  const [mode, setMode] = useState<'due' | 'all'>(() => initialDueCards.length > 0 ? 'due' : 'all');
  const [dueList] = useState<DeckCard[]>(initialDueCards);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Filter out reviewed cards in due mode
  const activeDueCards = useMemo(() => dueList.filter(c => !reviewedIds.has(c.id)), [dueList, reviewedIds]);

  const cards = mode === 'due' ? activeDueCards : allCards;
  const card = cards[pos < cards.length ? pos : 0];

  const handleNext = useCallback(() => {
    setRevealed(false);
    if (cards.length > 0) {
      setPos((p) => (p + 1) % cards.length);
    }
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    setRevealed(false);
    if (cards.length > 0) {
      setPos((p) => (p - 1 + cards.length) % cards.length);
    }
  }, [cards.length]);

  const handleShuffle = () => {
    setRevealed(false);
    if (cards.length > 1) {
      setPos(Math.floor(Math.random() * cards.length));
    }
  };

  // SM-2 Review submit
  const submitReview = async (quality: number) => {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          itemId: card.id,
          itemType: card.itemType || 'article',
          quality,
        }),
      });
      if (res.ok) {
        const qualityLabels: Record<number, string> = {
          1: '🔴 Marked for Review (Tomorrow)',
          2: '🟠 Rated Hard',
          4: '🟢 Rated Good',
          5: '🔵 Mastered / Easy',
        };
        setToast(qualityLabels[quality] || 'Review recorded');
        setTimeout(() => setToast(null), 2500);

        setReviewedIds((prev) => new Set(prev).add(card.id));
        setRevealed(false);
        if (pos >= cards.length - 1) {
          setPos(0);
        }
      }
    } catch {
      setToast('⚠️ Could not save review');
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (revealed && mode === 'due') {
        if (e.key === '1') submitReview(1);
        else if (e.key === '2') submitReview(2);
        else if (e.key === '3') submitReview(4);
        else if (e.key === '4') submitReview(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [revealed, mode, handleNext, handlePrev, card, submitting]);

  return (
    <div className="flash-wrap">
      {/* Review Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        <div className="panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>
            {activeDueCards.length}
          </div>
          <div className="small muted">Due Today</div>
        </div>
        <div className="panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
            {stats.total}
          </div>
          <div className="small muted">In Spaced Repetition</div>
        </div>
        <div className="panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>
            {stats.mastered}
          </div>
          <div className="small muted">Mastered (21d+)</div>
        </div>
        <div className="panel" style={{ padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
            {reviewedIds.size}
          </div>
          <div className="small muted">Reviewed in Session</div>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
        <button
          type="button"
          className={`btn ${mode === 'due' ? 'primary' : 'ghost'}`}
          style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setMode('due'); setPos(0); setRevealed(false); }}
        >
          <span>🎯 Due for Review</span>
          <span className="badge" style={{ background: mode === 'due' ? 'rgba(255,255,255,0.2)' : 'var(--panel-2)', fontSize: 11 }}>
            {activeDueCards.length}
          </span>
        </button>
        <button
          type="button"
          className={`btn ${mode === 'all' ? 'primary' : 'ghost'}`}
          style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setMode('all'); setPos(0); setRevealed(false); }}
        >
          <span>📚 Free Practice / All</span>
          <span className="badge" style={{ background: mode === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--panel-2)', fontSize: 11 }}>
            {allCards.length}
          </span>
        </button>
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--accent)',
          borderRadius: 8,
          padding: '8px 14px',
          marginBottom: 12,
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {toast}
        </div>
      )}

      {/* Empty State when due queue is done */}
      {!card ? (
        <div className="empty panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h3>{mode === 'due' ? 'All caught up for today!' : 'No flashcards available'}</h3>
          <p className="muted" style={{ maxWidth: 460, margin: '8px auto 18px' }}>
            {mode === 'due'
              ? 'You have reviewed all due cards for today. Your retention intervals have been updated using the SM-2 algorithm. You can continue practicing in Free Practice mode or add new articles to your review schedule from any article page.'
              : 'Add articles to revision or bookmark them to build your study deck.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {mode === 'due' && (
              <button
                type="button"
                className="btn primary"
                onClick={() => { setMode('all'); setPos(0); }}
              >
                Switch to Free Practice ({allCards.length} cards)
              </button>
            )}
            <Link className="btn ghost" href="/">
              Explore Feed
            </Link>
          </div>
        </div>
      ) : (
        /* Flashcard Container */
        <>
          <div className="flashcard" aria-live="polite">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="flash-q">
                {mode === 'due' ? 'SM-2 SPACED REPETITION' : 'QUESTION'}
              </span>
              {card.isDue && card.reps !== undefined && (
                <span className="tag" style={{ fontSize: 11, background: 'var(--panel-2)' }}>
                  Interval: {card.interval ?? 0}d · Rep #{card.reps}
                </span>
              )}
            </div>

            <div className="flash-question">{card.question}</div>

            {revealed ? (
              <div className="flash-answer">
                <span style={{ color: 'var(--accent)', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700 }}>
                  ANSWER
                </span>
                <div style={{ fontSize: 15, lineHeight: 1.5 }}>{card.answer}</div>
                {card.why && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <b style={{ color: 'var(--amber)', fontSize: 10, letterSpacing: '0.14em', flex: 'none', paddingTop: 3 }}>
                      WHY IMPORTANT
                    </b>
                    <span style={{ fontSize: 13.5 }}>{card.why}</span>
                  </div>
                )}
                <div className="small muted" style={{ marginTop: 8 }}>
                  Source: {card.source} · <Link href={card.href} className="underline">open full article</Link>
                </div>

                {/* SM-2 Rating Buttons in Due Mode */}
                {mode === 'due' && (
                  <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                    <div className="small muted" style={{ marginBottom: 8, fontWeight: 600 }}>
                      How well did you recall this? (Keys 1-4)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          flexDirection: 'column',
                          padding: '8px 4px',
                        }}
                        onClick={() => submitReview(1)}
                        disabled={submitting}
                      >
                        <span style={{ fontWeight: 700, fontSize: 13 }}>[1] Again</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>1 day</span>
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{
                          borderColor: 'rgba(245, 158, 11, 0.4)',
                          color: '#f59e0b',
                          flexDirection: 'column',
                          padding: '8px 4px',
                        }}
                        onClick={() => submitReview(2)}
                        disabled={submitting}
                      >
                        <span style={{ fontWeight: 700, fontSize: 13 }}>[2] Hard</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{Math.max(1, Math.round((card.interval || 1) * 1.2))}d</span>
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{
                          borderColor: 'rgba(59, 130, 246, 0.4)',
                          color: 'var(--accent)',
                          flexDirection: 'column',
                          padding: '8px 4px',
                        }}
                        onClick={() => submitReview(4)}
                        disabled={submitting}
                      >
                        <span style={{ fontWeight: 700, fontSize: 13 }}>[3] Good</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{Math.max(2, Math.round((card.interval || 1) * (card.easeFactor || 2.5)))}d</span>
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        style={{
                          borderColor: 'rgba(16, 185, 129, 0.4)',
                          color: 'var(--green, #10b981)',
                          flexDirection: 'column',
                          padding: '8px 4px',
                        }}
                        onClick={() => submitReview(5)}
                        disabled={submitting}
                      >
                        <span style={{ fontWeight: 700, fontSize: 13 }}>[4] Easy</span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{Math.max(4, Math.round((card.interval || 1) * (card.easeFactor || 2.5) * 1.3))}d</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn primary"
                style={{ alignSelf: 'flex-start', marginTop: 12 }}
                onClick={() => setRevealed(true)}
              >
                Show Answer (Space)
              </button>
            )}
          </div>

          {/* Standard deck controls */}
          <div className="flash-controls">
            <button type="button" className="btn ghost" onClick={handlePrev}>← Previous</button>
            <button type="button" className="btn" onClick={() => setRevealed((r) => !r)}>
              {revealed ? 'Hide' : 'Show'} Answer
            </button>
            <button type="button" className="btn ghost" onClick={handleNext}>Next →</button>
            <button type="button" className="btn ghost" onClick={handleShuffle}>⇄ Shuffle</button>
          </div>
          <div className="flash-progress">
            Card {pos + 1} of {cards.length} · <span className="muted">Space: flip · Arrows: navigate</span>
          </div>
        </>
      )}
    </div>
  );
}
