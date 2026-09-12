import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { IntelligenceRail } from './IntelligenceRail';
import { FeedStatusProvider } from './FeedStatus';
import { RegisterSW } from '@/components/pwa/RegisterSW';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { latestRun, articleCount, sourceStats } from '@/lib/db/queries';
import { nextUpdateAt } from '@/lib/utils/time';

export async function AppShell({ children }: { children: ReactNode }) {
  const run = latestRun();
  const stats = sourceStats();

  const status = {
    lastUpdated: run?.finished_at ?? run?.started_at ?? null,
    nextUpdate: nextUpdateAt(),
    runStatus: run?.status ?? 'none',
    mode: run?.mode ?? 'demo',
    totalArticles: articleCount(),
    sourcesEnabled: stats.enabled,
  };

  return (
    <FeedStatusProvider value={status}>
      <div className="shell">
        <Sidebar />
        <div className="shell-body">
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Topbar />
            <main className="shell-main" id="main">{children}</main>
          </div>
          <IntelligenceRail />
        </div>
        <BottomNav />
        <RegisterSW />
        <KeyboardShortcuts />
      </div>
    </FeedStatusProvider>
  );
}
