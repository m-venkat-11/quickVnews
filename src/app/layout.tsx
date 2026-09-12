import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { APP } from '@/lib/config';
import { getSessionUserId } from '@/lib/session';
import { getPrefs } from '@/lib/db/queries';
import { AppShell } from '@/components/shell/AppShell';

export const metadata: Metadata = {
  title: {
    default: APP.seoTitle,
    template: `%s · ${APP.name}`,
  },
  description: APP.description,
  applicationName: APP.name,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  openGraph: {
    title: APP.seoTitle,
    description: APP.description,
    siteName: APP.name,
    type: 'website',
  },
  keywords: [
    'UPSC current affairs', 'APPSC', 'government exams', 'India news analysis',
    'geopolitics', 'Andhra Pradesh news', 'Visakhapatnam', 'AI news dashboard',
  ],
};

export const viewport: Viewport = {
  themeColor: '#0b0e13',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();
  const prefs = getPrefs(userId);
  const theme = (prefs as { theme?: string }).theme === 'light' ? 'light' : 'dark';

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('prism-theme');if(s){document.documentElement.dataset.theme=s;}}catch(e){}})();`,
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
