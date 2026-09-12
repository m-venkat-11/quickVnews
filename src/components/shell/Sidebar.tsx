'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, PrismLogo } from '@/components/icons';

const NAV: { href: string; label: string; icon: string }[] = [
  { href: '/', label: 'Overview', icon: 'bolt' },
  { href: '/brief', label: 'Daily Brief', icon: 'doc' },
  { href: '/topic/india', label: 'India', icon: 'india' },
  { href: '/topic/world', label: 'World', icon: 'world' },
  { href: '/topic/geopolitics', label: 'Geopolitics', icon: 'map' },
  { href: '/topic/ap', label: 'Andhra Pradesh', icon: 'ap' },
  { href: '/topic/visakhapatnam', label: 'Visakhapatnam', icon: 'vizag' },
  { href: '/topic/economy', label: 'Economy', icon: 'economy' },
  { href: '/topic/ai', label: 'AI', icon: 'ai' },
  { href: '/topic/science', label: 'Science & Space', icon: 'science' },
  { href: '/topic/defence', label: 'Defence', icon: 'defence' },
  { href: '/topic/environment', label: 'Environment', icon: 'environment' },
  { href: '/topic/government', label: 'Government', icon: 'government' },
  { href: '/topic/jobs', label: 'Jobs', icon: 'jobs' },
  { href: '/upsc', label: 'Exam Prep', icon: 'upsc' },
];

const SECONDARY: { href: string; label: string; icon: string }[] = [
  { href: '/revision', label: 'Revision Mode', icon: 'revision' },
  { href: '/bookmarks', label: 'My Revision', icon: 'bookmark' },
  { href: '/facts', label: 'Facts', icon: 'sparkles' },
  { href: '/tools', label: 'AI Tools', icon: 'wrench' },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <Link href="/" className="brand" aria-label="PRISM CURRENT home">
        <span className="brand-mark"><PrismLogo size={19} /></span>
        <span>
          <span className="brand-name">PRISM<br /><span>CURRENT</span></span>
          <span className="brand-sub">UNDERSTAND WHAT MATTERS</span>
        </span>
      </Link>

      <nav className="nav-section" aria-label="Sections">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-link${isActive(item.href) ? ' active' : ''}`}>
            <span className="nl-icon"><Icon name={item.icon} size={17} /></span>
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="nav-section" aria-label="Study tools" style={{ marginTop: 'auto' }}>
        <div className="nav-label">Study Tools</div>
        {SECONDARY.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-link${isActive(item.href) ? ' active' : ''}`}>
            <span className="nl-icon"><Icon name={item.icon} size={17} /></span>
            {item.label}
          </Link>
        ))}
        <Link href="/settings" className={`nav-link${pathname.startsWith('/settings') ? ' active' : ''}`}>
          <span className="nl-icon"><Icon name="settings" size={17} /></span>
          Settings
        </Link>
      </nav>
    </aside>
  );
}
