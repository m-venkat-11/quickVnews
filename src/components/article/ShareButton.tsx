'use client';

import { useState } from 'react';

interface ShareProps {
  title: string;
  url: string;
  summary?: string | null;
}

export function ShareButton({ title, url, summary }: ShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  const text = `${title}${summary ? ` — ${summary}` : ''}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${fullUrl}`)}`, '_blank');
    setOpen(false);
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    setOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: summary ?? undefined, url: fullUrl });
      } catch { /* user cancelled */ }
      setOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="btn ghost"
        style={{ fontSize: 13 }}
        onClick={() => {
          if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            nativeShare();
          } else {
            setOpen(!open);
          }
        }}
      >
        📤 Share
      </button>
      {open && (
        <div className="share-menu" style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 10, padding: 6, display: 'flex', flexDirection: 'column',
          gap: 2, minWidth: 180, zIndex: 100, boxShadow: 'var(--shadow)',
        }}>
          <button type="button" onClick={shareWhatsApp} className="share-option" style={optStyle}>
            💬 WhatsApp
          </button>
          <button type="button" onClick={shareTelegram} className="share-option" style={optStyle}>
            ✈️ Telegram
          </button>
          <button type="button" onClick={copyLink} className="share-option" style={optStyle}>
            {copied ? '✅ Copied!' : '🔗 Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}

const optStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', color: 'var(--text-2)',
  padding: '8px 12px', fontSize: 13, cursor: 'pointer', textAlign: 'left',
  borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8,
};
