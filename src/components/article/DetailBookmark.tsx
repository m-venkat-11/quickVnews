'use client';

import { BookmarkButton } from './BookmarkButton';

export function DetailBookmark({ articleId }: { articleId: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
      <BookmarkButton itemId={articleId} size="lg" />
    </div>
  );
}
