'use client';

import { useEffect, useRef } from 'react';

/** Silently marks the article as read and tracks time spent on the page. */
export function ReadTracker({ articleId }: { articleId: string }) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    // Mark as read immediately on mount
    fetch('/api/reading', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articleId, timeSpentMs: 0 }),
    }).catch(() => {});

    // Track time spent on page
    const start = startRef.current;
    return () => {
      const timeSpentMs = Date.now() - start;
      if (timeSpentMs > 3000) { // Only track if they stayed > 3s
        // Use sendBeacon for reliable tracking on page leave
        const data = JSON.stringify({ articleId, timeSpentMs });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/reading', new Blob([data], { type: 'application/json' }));
        }
      }
    };
  }, [articleId]);

  return null;
}
