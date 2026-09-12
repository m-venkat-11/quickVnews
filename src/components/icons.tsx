/** Minimal inline SVG icon set — zero dependencies, currentColor based. */

export function PrismLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 L21 19 H3 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 2 L12 19" stroke="currentColor" strokeWidth="1.1" opacity="0.65" />
      <path d="M7.5 10.5 L16.5 10.5" stroke="currentColor" strokeWidth="1.1" opacity="0.65" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'bolt':
      return <svg {...common}><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z" /></svg>;
    case 'india':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>;
    case 'world':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.7 2.6 4 5.7 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.7-4-9s1.3-6.4 4-9z" /></svg>;
    case 'ap':
      return <svg {...common}><path d="M4 15c1.5-4 4-6.5 8-7 3.4-.4 6.2.6 8 3-1.6 4.4-4.6 7-9 7-3.2 0-5.6-1-7-3z" /><circle cx="9" cy="11" r="1.1" /></svg>;
    case 'vizag':
      return <svg {...common}><path d="M3 17c2-1.2 4-1.2 6 0s4 1.2 6 0 4-1.2 6 0" /><path d="M3 21c2-1.2 4-1.2 6 0s4 1.2 6 0 4-1.2 6 0" /><path d="M12 13V4l6 3-6 3" /></svg>;
    case 'economy':
      return <svg {...common}><path d="M3 20h18" /><path d="M4 16l4.5-5 3.5 3 4-6 4 4" /></svg>;
    case 'ai':
      return <svg {...common}><rect x="5" y="5" width="14" height="14" rx="3" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /><circle cx="10" cy="11" r="1.3" /><circle cx="14" cy="11" r="1.3" /></svg>;
    case 'science':
      return <svg {...common}><path d="M10 3v6L4.8 18a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3L14 9V3" /><path d="M8.5 3h7" /><path d="M7.5 15h9" /></svg>;
    case 'defence':
      return <svg {...common}><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" /></svg>;
    case 'environment':
      return <svg {...common}><path d="M12 21c-5 0-8.5-3.6-8.5-8C3.5 7.6 7.4 3 13 3c0 3.5 1.8 5.3 4.3 6.4C19.6 10.4 21 12.6 21 15c0 3.6-3.6 6-9 6z" /><path d="M12 21c0-6 2.5-9.5 6-11" /></svg>;
    case 'government':
      return <svg {...common}><path d="M3 21h18" /><path d="M5 21V10l7-6 7 6v11" /><path d="M9 21v-6h6v6" /><path d="M9 12h.01M12 12h.01M15 12h.01" /></svg>;
    case 'jobs':
      return <svg {...common}><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M4 13h16" /></svg>;
    case 'upsc':
      return <svg {...common}><path d="M12 3a4.2 4.2 0 0 1 4.2 4.2c0 2.6-1.6 4.6-2.7 7.3-.6 1.5-1 3-1.5 4.5-.5-1.5-.9-3-1.5-4.5C9.4 11.8 7.8 9.8 7.8 7.2A4.2 4.2 0 0 1 12 3z" /><circle cx="12" cy="7" r="1.4" /></svg>;
    case 'revision':
      return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /><path d="M12 7v5l3.5 2" /></svg>;
    case 'search':
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>;
    case 'bookmark':
      return <svg {...common}><path d="M6 3h12v18l-6-4-6 4V3z" /></svg>;
    case 'bookmark-filled':
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4V3z" /></svg>;
    case 'sun':
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case 'moon':
      return <svg {...common}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" /></svg>;
    case 'settings':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></svg>;
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>;
    case 'map':
      return <svg {...common}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>;
    case 'shield-check':
      return <svg {...common}><path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z" /><path d="m9 12 2 2 4-4.5" /></svg>;
    case 'info':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11v5" /></svg>;
    case 'alert':
      return <svg {...common}><path d="M12 3 2.5 20h19L12 3z" /><path d="M12 9v5M12 17h.01" /></svg>;
    case 'book':
      return <svg {...common}><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 0 2 2h13" /></svg>;
    case 'sparkles':
      return <svg {...common}><path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" /></svg>;
    case 'grad':
      return <svg {...common}><path d="m12 4 10 5-10 5L2 9l10-5z" /><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" /></svg>;
    case 'wrench':
      return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4L14 13l-3-3 3.7-3.7z" /></svg>;
    case 'fun':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8.5 14.5c.9 1.2 2.1 1.9 3.5 1.9s2.6-.7 3.5-1.9" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>;
    case 'layers':
      return <svg {...common}><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 16 9 5 9-5" /></svg>;
    case 'doc':
      return <svg {...common}><path d="M6 2h9l5 5v15H6V2z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
