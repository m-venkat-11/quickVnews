/** Text utilities shared by the ingestion pipeline and search. */

const STOPWORDS = new Set(
  ('a,an,and,are,as,at,be,by,for,from,has,have,he,in,is,it,its,of,on,or,that,the,to,was,were,will,with,' +
    'said,says,after,before,over,under,about,into,than,then,they,their,this,these,those,but,not,you,your,' +
    'his,her,she,him,who,whom,which,what,when,where,why,how,also,more,most,new,news,report,reports,amid,' +
    'against,among,because,been,being,between,during,further,here,out,same,some,such,no,nor,only,own,so,too,very')
    .split(',')
);

export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(t: string): string[] {
  return normalizeTitle(t)
    .split(' ')
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/** Jaccard similarity over token sets — cheap and effective for headline dedupe. */
export function similarity(a: string, b: string): number {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

export function truncate(s: string, max = 220): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

/** Deterministic top keywords from title + description. */
export function extractKeywords(text: string, limit = 8): string[] {
  const freq = new Map<string, number>();
  for (const w of tokenize(text)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .sort((x, y) => y[1] - x[1] || y[0].length - x[0].length)
    .slice(0, limit)
    .map(([w]) => w);
}

const KNOWN_ENTITIES = [
  'RBI', 'SEBI', 'ISRO', 'DRDO', 'NASA', 'UPI', 'GST', 'NITI Aayog', 'Supreme Court', 'Parliament',
  'Lok Sabha', 'Rajya Sabha', 'Election Commission', 'PIB', 'IMF', 'World Bank', 'WHO', 'UN', 'NATO',
  'APPSC', 'UPSC', 'SSC', 'SBI', 'IBPS', 'RRB', 'NTA', 'Amaravati', 'Visakhapatnam', 'Polavaram',
  'OpenAI', 'Google', 'Microsoft', 'Nvidia', 'Apple', 'Meta', 'Anthropic', 'TSMC', 'ISRO', 'G20', 'BRICS',
  'SCO', 'ASEAN', 'SAARC', 'COP', 'IPCC', 'IAEA', 'WTO', 'FATF', 'HAL', 'BHEL', 'ONGC', 'NTPC', 'CIL',
];

/** Case-sensitive known-entity spotting (cheap NER, good enough for tagging). */
export function extractEntities(text: string, limit = 8): string[] {
  const found = new Set<string>();
  for (const ent of KNOWN_ENTITIES) {
    const re = new RegExp(`\\b${ent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(text)) found.add(ent);
  }
  // Capitalised multi-word names (crude but useful): "Nara Chandrababu Naidu"
  const proper = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/g) ?? [];
  for (const p of proper.slice(0, 30)) found.add(p);
  return [...found].slice(0, limit);
}

export function sentenceSplit(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}
