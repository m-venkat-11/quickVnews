'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { istFull, relTime, countdown } from '@/lib/utils/time';

export function HeroStatus({ lastUpdated, nextUpdate, slotInfo }: {
  lastUpdated: string | null;
  nextUpdate: number;
  slotInfo?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hero-status status-line">
      <span className="status-pill">
        <span className="dot" />
        Last update: {lastUpdated ? `${istFull(lastUpdated)} IST` : 'pending'}
      </span>
      <span className="status-pill">
        {lastUpdated ? `Updated ${relTime(lastUpdated, now ?? Date.now())}` : 'Awaiting first cycle'}
      </span>
      <span className="status-pill" title={slotInfo}>
        <Icon name="clock" size={12} />
        Next briefing in {now === null ? '…' : countdown(nextUpdate - now)}
      </span>
    </div>
  );
}
