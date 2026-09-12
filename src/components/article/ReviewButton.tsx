'use client';

import { useState } from 'react';

/** Button to add/remove an article from the spaced-repetition review schedule. */
export function ReviewButton({ itemId, itemType = 'article' }: { itemId: string; itemType?: string }) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: added ? 'remove' : 'add',
          itemType,
          itemId,
        }),
      });
      if (res.ok) setAdded(!added);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <button
      type="button"
      className={`btn ${added ? 'primary' : 'ghost'}`}
      onClick={toggle}
      disabled={loading}
      title={added ? 'Remove from revision schedule' : 'Add to spaced-repetition schedule'}
      style={{ fontSize: 13 }}
    >
      {added ? '✓ In Review Schedule' : '🧠 Add to Review'}
    </button>
  );
}
