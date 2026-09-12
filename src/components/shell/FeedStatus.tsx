'use client';

import { createContext, useContext, type ReactNode } from 'react';

export interface FeedStatus {
  lastUpdated: string | null;
  nextUpdate: number; // epoch ms
  runStatus: string;
  mode: string;
  totalArticles: number;
  sourcesEnabled: number;
}

export const FeedStatusContext = createContext<FeedStatus>({
  lastUpdated: null,
  nextUpdate: Date.now() + 6 * 3600_000,
  runStatus: 'none',
  mode: 'demo',
  totalArticles: 0,
  sourcesEnabled: 0,
});

// Must be a real function component (not an alias of .Provider) so it can be
// rendered from server components across the RSC boundary.
export function FeedStatusProvider({
  value,
  children,
}: {
  value: FeedStatus;
  children: ReactNode;
}) {
  return <FeedStatusContext.Provider value={value}>{children}</FeedStatusContext.Provider>;
}

export function useFeedStatus(): FeedStatus {
  return useContext(FeedStatusContext);
}
