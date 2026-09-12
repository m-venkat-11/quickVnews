'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon, PrismLogo } from '@/components/icons';
import { useFeedStatus } from './FeedStatus';
import { istFull, countdown } from '@/lib/utils/time';

export function Topbar() {
  const status = useFeedStatus();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    const stored = localStorage.getItem('prism-theme');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('prism-theme', next);
    document.documentElement.dataset.theme = next;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const nextIn = status.nextUpdate - (now ?? status.nextUpdate);

  return (
    <header className="topbar">
      <Link href="/" className="brand-mobile" aria-label="PRISM CURRENT home">
        <span className="brand-mark"><PrismLogo size={16} /></span>
        <span className="brand-name" style={{ fontSize: 12.5 }}>PRISM<span>CURRENT</span></span>
      </Link>

      <form className="topbar-search" role="search" onSubmit={submit}>
        <span className="ts-icon"><Icon name="search" size={15} /></span>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search headlines, topics, GS papers, countries…"
          aria-label="Search current affairs"
        />
        <kbd>⌘K</kbd>
      </form>

      <div className="topbar-clock" title={status.lastUpdated ? `Last update: ${istFull(status.lastUpdated)} IST` : undefined}>
        <span className="tc-label">Last Update</span>
        <span className="tc-value">
          {status.lastUpdated ? istFull(status.lastUpdated) : '—'}
        </span>
      </div>
      <span className="status-pill" title="Next scheduled 6-hour update">
        <Icon name="clock" size={12} />
        {now === null ? '…' : `next in ${countdown(nextIn)}`}
      </span>

      <Link href="/bookmarks" className="icon-btn" aria-label="Bookmarks" title="Bookmarks">
        <Icon name="bookmark" size={16} />
      </Link>
      <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>
      <Link href="/settings" className="icon-btn" aria-label="Settings" title="Settings">
        <Icon name="settings" size={16} />
      </Link>
    </header>
  );
}
