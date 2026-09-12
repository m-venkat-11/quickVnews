/** Dependency-free RSS/Atom fetch + parse. Fails soft: errors are per-source. */

export interface RssItem {
  title: string;
  url: string;
  description: string | null;
  publishedAt: Date;
}

function pick(block: string, tag: string): string | null {
  const re = new RegExp(`<(?:${tag})(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:${tag})>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function unescape(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

export function parseFeed(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // RSS <item> blocks
  const rssBlocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  for (const block of rssBlocks) {
    const title = unescape(pick(block, 'title') ?? '');
    let link = unescape(pick(block, 'link') ?? '');
    if (!link) {
      const atom = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (atom) link = unescape(atom[1]);
    }
    const desc = unescape(pick(block, 'description') ?? '');
    const dateStr = pick(block, 'pubDate') ?? pick(block, 'published') ?? pick(block, 'updated') ?? pick(block, 'dc:date');
    const publishedAt = dateStr ? new Date(dateStr) : new Date();
    if (title && link) {
      items.push({ title, url: link, description: desc || null, publishedAt });
    }
  }

  // Atom <entry> blocks (when no <item> matched)
  if (!items.length) {
    const atomBlocks = xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) ?? [];
    for (const block of atomBlocks) {
      const title = unescape(pick(block, 'title') ?? '');
      let link = '';
      const lm = block.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (lm) link = unescape(lm[1]);
      const desc = unescape(pick(block, 'summary') ?? pick(block, 'content') ?? '');
      const dateStr = pick(block, 'published') ?? pick(block, 'updated');
      const publishedAt = dateStr ? new Date(dateStr) : new Date();
      if (title && link) items.push({ title, url: link, description: desc || null, publishedAt });
    }
  }
  return items;
}

export interface FetchResult {
  items: RssItem[];
  error: string | null;
}

export async function fetchFeed(url: string, timeoutMs = 12_000): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'PrismCurrent/1.0 (+current-affairs dashboard)', accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    if (!res.ok) return { items: [], error: `HTTP ${res.status}` };
    const xml = await res.text();
    return { items: parseFeed(xml), error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : 'fetch failed' };
  }
}
