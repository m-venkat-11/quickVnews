'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';

const ITEMS: { href: string; label: string; icon: string }[] = [
  { href: '/', label: 'Feed', icon: 'bolt' },
  { href: '/brief', label: 'Brief', icon: 'doc' },
  { href: '/upsc', label: 'Exam', icon: 'upsc' },
  { href: '/revision', label: 'Revise', icon: 'revision' },
  { href: '/bookmarks', label: 'Saved', icon: 'bookmark' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={item.href === '/' ? (pathname === '/' ? 'active' : '') : (pathname.startsWith(item.href) ? 'active' : '')}
        >
          <span className="bn-icon"><Icon name={item.icon} size={20} /></span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
