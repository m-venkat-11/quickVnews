'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Clear selection when navigating
  useEffect(() => {
    setSelectedIndex(-1);
    // Remove highlight from any previous cards
    document.querySelectorAll('.card-kb-active').forEach(el => el.classList.remove('card-kb-active'));
  }, [pathname]);

  const getCards = useCallback(() => {
    return Array.from(document.querySelectorAll<HTMLElement>('article.card, .card'));
  }, []);

  const highlightCard = useCallback((index: number) => {
    const cards = getCards();
    cards.forEach(c => c.classList.remove('card-kb-active'));
    if (index >= 0 && index < cards.length) {
      const card = cards[index];
      card.classList.add('card-kb-active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [getCards]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in form inputs
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false);
        setSelectedIndex(-1);
        document.querySelectorAll('.card-kb-active').forEach(el => el.classList.remove('card-kb-active'));
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[name="q"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          router.push('/search');
        }
        return;
      }

      if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push('/revision');
        return;
      }

      const cards = getCards();
      if (cards.length === 0) return;

      if (e.key === 'j') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev < cards.length - 1 ? prev + 1 : 0;
          highlightCard(next);
          return next;
        });
      } else if (e.key === 'k') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const next = prev > 0 ? prev - 1 : cards.length - 1;
          highlightCard(next);
          return next;
        });
      } else if (e.key === 'Enter' || e.key === 'o') {
        if (selectedIndex >= 0 && selectedIndex < cards.length) {
          const link = cards[selectedIndex].querySelector<HTMLAnchorElement>('h3 a, a.card-title');
          if (link?.href) {
            e.preventDefault();
            router.push(link.href);
          }
        }
      } else if (e.key === 'b') {
        if (selectedIndex >= 0 && selectedIndex < cards.length) {
          const bookmarkBtn = cards[selectedIndex].querySelector<HTMLButtonElement>('button.bm-btn, button[aria-label*="bookmark" i]');
          if (bookmarkBtn) {
            e.preventDefault();
            bookmarkBtn.click();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getCards, highlightCard, router, selectedIndex]);

  return (
    <>
      <style jsx global>{`
        .card-kb-active {
          outline: 2px solid var(--accent) !important;
          outline-offset: 2px;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.25) !important;
        }
      `}</style>

      {showHelp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 440,
              width: '100%',
              borderRadius: 14,
              padding: '24px 20px',
              border: '1px solid var(--line)',
              boxShadow: 'var(--shadow)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⌨️</span> Keyboard Shortcuts
              </h3>
              <button
                type="button"
                className="btn ghost"
                style={{ padding: '2px 8px', fontSize: 12 }}
                onClick={() => setShowHelp(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Focus search / Open search</span>
                <kbd style={kbdStyle}>/</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Next article card</span>
                <kbd style={kbdStyle}>j</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Previous article card</span>
                <kbd style={kbdStyle}>k</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Open selected article</span>
                <kbd style={kbdStyle}>Enter / o</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Bookmark selected article</span>
                <kbd style={kbdStyle}>b</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Go to Revision & Spaced Repetition</span>
                <kbd style={kbdStyle}>r</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Spaced Repetition ratings (in flashcard)</span>
                <kbd style={kbdStyle}>1 - 4</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">Show / hide this cheat sheet</span>
                <kbd style={kbdStyle}>?</kbd>
              </div>
            </div>

            <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
              <button
                type="button"
                className="btn primary"
                style={{ width: '100%', fontSize: 13 }}
                onClick={() => setShowHelp(false)}
              >
                Got it (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const kbdStyle: React.CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '3px 8px',
  fontFamily: 'monospace',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--accent)',
};
