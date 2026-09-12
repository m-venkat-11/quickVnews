'use client';

import { useState, useTransition } from 'react';
import { Icon } from '@/components/icons';

export function BookmarkButton({
  itemId, itemType = 'article', initial = false, size = 'sm',
}: {
  itemId: string;
  itemType?: 'article' | 'fact' | 'learning' | 'tool';
  initial?: boolean;
  size?: 'sm' | 'lg';
}) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next); // optimistic
    startTransition(async () => {
      try {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ itemId, itemType }),
        });
        const data = (await res.json()) as { bookmarked?: boolean };
        if (typeof data.bookmarked === 'boolean') setOn(data.bookmarked);
      } catch {
        setOn(!next); // revert on failure
      }
    });
  };

  return (
    <button
      type="button"
      className={`bm-btn${on ? ' on' : ''}`}
      onClick={toggle}
      disabled={pending}
      aria-pressed={on}
      aria-label={on ? 'Remove bookmark' : 'Bookmark for revision'}
      title={on ? 'Saved to My Revision' : 'Bookmark for revision'}
      style={size === 'lg' ? { width: 38, height: 38 } : undefined}
    >
      <Icon name={on ? 'bookmark-filled' : 'bookmark'} size={size === 'lg' ? 18 : 15} />
    </button>
  );
}
