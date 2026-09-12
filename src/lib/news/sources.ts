/**
 * Curated FREE source catalog — no paid APIs.
 * tier 1 = official/primary (PIB, RBI, ECI, ISRO…), tier 2 = reputable news,
 * tier 3 = general. Sources failing repeatedly are auto-disabled at runtime.
 */
export interface SourceCatalogEntry {
  id: string;
  name: string;
  url: string;
  kind: 'rss' | 'official' | 'api';
  tier: number;
  categories: string[]; // category slugs this feed feeds into
}

export const SOURCE_CATALOG: SourceCatalogEntry[] = [
  // ---- Official / primary (tier 1) ----
  { id: 'pib', name: 'PIB — Press Information Bureau', url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3', kind: 'rss', tier: 1, categories: ['india', 'government', 'politics', 'jobs'] },
  { id: 'rbi', name: 'RBI — Press Releases', url: 'https://www.rbi.org.in/scripts/RSSHighlightFeeds.aspx', kind: 'rss', tier: 1, categories: ['economy'] },
  { id: 'isro', name: 'ISRO', url: 'https://www.isro.gov.in/rss.xml', kind: 'rss', tier: 1, categories: ['science'] },
  { id: 'eci', name: 'Election Commission of India', url: 'https://eci.gov.in/rssfeeds/press-releases', kind: 'rss', tier: 1, categories: ['politics', 'jobs'] },

  // ---- Reputable national (tier 2) ----
  { id: 'thehindu-national', name: 'The Hindu — National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', kind: 'rss', tier: 2, categories: ['india', 'politics'] },
  { id: 'thehindu-editorial', name: 'The Hindu — Editorial', url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', kind: 'rss', tier: 1, categories: ['india', 'politics', 'government', 'world'] },
  { id: 'thehindu-ap', name: 'The Hindu — Andhra Pradesh', url: 'https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss', kind: 'rss', tier: 2, categories: ['ap', 'vizag'] },
  { id: 'thehindu-world', name: 'The Hindu — World', url: 'https://www.thehindu.com/news/international/feeder/default.rss', kind: 'rss', tier: 2, categories: ['world'] },
  { id: 'thehindu-business', name: 'The Hindu — Business', url: 'https://www.thehindu.com/business/Economy/feeder/default.rss', kind: 'rss', tier: 2, categories: ['economy'] },
  { id: 'thehindu-sci', name: 'The Hindu — Science & Tech', url: 'https://www.thehindu.com/sci-tech/feeder/default.rss', kind: 'rss', tier: 2, categories: ['science'] },
  { id: 'thehindu-env', name: 'The Hindu — Environment', url: 'https://www.thehindu.com/sci-tech/energy-and-environment/feeder/default.rss', kind: 'rss', tier: 2, categories: ['environment'] },
  { id: 'indianexpress', name: 'Indian Express — India', url: 'https://indianexpress.com/section/india/feed/', kind: 'rss', tier: 2, categories: ['india', 'politics'] },
  { id: 'toi-top', name: 'Times of India — Top Stories', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', kind: 'rss', tier: 2, categories: ['india', 'politics', 'government'] },
  { id: 'toi-world', name: 'Times of India — World', url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', kind: 'rss', tier: 2, categories: ['world'] },
  { id: 'ht-india', name: 'Hindustan Times — India', url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', kind: 'rss', tier: 2, categories: ['india', 'government'] },
  { id: 'livemint-econ', name: 'Livemint — Economy', url: 'https://www.livemint.com/rss/news', kind: 'rss', tier: 2, categories: ['economy', 'government'] },
  { id: 'livemint-tech', name: 'Livemint — Technology', url: 'https://www.livemint.com/rss/technology', kind: 'rss', tier: 2, categories: ['ai', 'science'] },
  { id: 'ndtv-top', name: 'NDTV — Top Stories', url: 'https://feeds.feedburner.com/ndtvnews-top-stories', kind: 'rss', tier: 2, categories: ['india', 'politics'] },
  { id: 'hindubusinessline-econ', name: 'Business Standard — Economy', url: 'https://www.business-standard.com/rss/economy-102.rss', kind: 'rss', tier: 2, categories: ['economy'] },

  // ---- International (tier 2) ----
  { id: 'bbc-world', name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', kind: 'rss', tier: 2, categories: ['world'] },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', kind: 'rss', tier: 2, categories: ['world'] },
  { id: 'dw-world', name: 'Deutsche Welle', url: 'https://rss.dw.com/rdf/rss-en-world', kind: 'rss', tier: 2, categories: ['world'] },

  // ---- AI & technology (tier 2/3) ----
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', kind: 'rss', tier: 3, categories: ['ai', 'science'] },

  // ---- Defence (tier 3) ----
  { id: 'idrw', name: 'IDRW — Defence Research', url: 'https://idrw.org/feed/', kind: 'rss', tier: 3, categories: ['defence'] },

  // ---- Environment (tier 2) ----
  { id: 'dte', name: 'Down To Earth', url: 'https://www.downtoearth.org.in/rss', kind: 'rss', tier: 2, categories: ['environment'] },

  // ---- AP local (tier 2/3) ----
  { id: 'andhrajyothy-vzg', name: 'Andhra Jyothy — Visakhapatnam', url: 'https://www.andhrajyothy.com/rss/visakhapatnam', kind: 'rss', tier: 3, categories: ['vizag'] },
];

/** Sources are tried in tier order so official content outranks general press. */
export function sourcesForCategories(cats: string[]): SourceCatalogEntry[] {
  return SOURCE_CATALOG.filter((s) => s.categories.some((c) => cats.includes(c))).sort(
    (a, b) => a.tier - b.tier
  );
}
