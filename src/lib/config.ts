/**
 * PRISM CURRENT — central configuration.
 * The app runs with zero env vars. Optional keys (see .env.example) upgrade behavior.
 */

export const APP = {
  name: 'PRISM CURRENT',
  shortName: 'PRISM',
  tagline: 'Understand what matters.',
  subtitle: 'AI-curated current affairs for UPSC, APPSC and government-exam preparation.',
  description:
    'AI-curated Indian, global, geopolitical and Andhra Pradesh current affairs for UPSC, APPSC and government exam preparation.',
  seoTitle: 'PRISM Current — AI-Powered Current Affairs for UPSC & APPSC',
} as const;

/** Display timezone for all user-facing timestamps. */
export const IST = 'Asia/Kolkata';

/** Update cadence — the product refreshes its intelligence feed every 6 hours. */
export const UPDATE_INTERVAL_HOURS = 6;

/** Canonical IST run slots (00:00 / 06:00 / 12:00 / 18:00). */
export const UPDATE_SLOTS_IST = ['00:00', '06:00', '12:00', '18:00'];

/** DB lives beside the app; overridable for deployments with a data volume. Uses /tmp on serverless/Vercel. */
export const DB_PATH =
  process.env.PRISM_DB_PATH ||
  (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? '/tmp/prism.db' : 'data/prism.db');

/** AI summarization (optional). Falls back to deterministic local processing. */
export const AI = {
  apiKey: process.env.AI_API_KEY || '',
  baseUrl: process.env.AI_API_BASE_URL || 'https://api.openai.com/v1',
  model: process.env.AI_MODEL || 'gpt-4o-mini',
  timeoutMs: 25_000,
};

export const ADMIN_ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '127.0.0.1,::1,::ffff:127.0.0.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const CRON_SECRET = process.env.CRON_SECRET || '';

export const ALLOW_LIVE_INGESTION_ON_START = process.env.ALLOW_LIVE_INGESTION_ON_START === '1';

/**
 * Category registry — drives navigation, sections and filters.
 * `weight` feeds the importance scorer; `gs` maps to UPSC GS papers.
 */
export interface CategoryDef {
  slug: string;
  label: string;
  short: string;
  description: string;
  parent: string | null;
  weight: number;
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { slug: 'top', label: 'Top Developments', short: 'Top', description: 'Highest-ranked developments from the latest cycle.', parent: null, weight: 0, icon: 'bolt' },
  { slug: 'india', label: 'India — National', short: 'India', description: 'Central government, Parliament, courts, policy and national affairs.', parent: null, weight: 6, icon: 'india' },
  { slug: 'politics', label: 'Central Government & Politics', short: 'Politics', description: 'Parliament, bills, cabinet decisions — reported with strict neutrality.', parent: 'india', weight: 4, icon: 'politics' },
  { slug: 'world', label: 'World & Geopolitics', short: 'World', description: 'Strategy, diplomacy and power across regions — with the India angle.', parent: null, weight: 6, icon: 'world' },
  { slug: 'ap', label: 'Andhra Pradesh', short: 'AP', description: 'State government, schemes, investments and APPSC-relevant developments.', parent: null, weight: 5, icon: 'ap' },
  { slug: 'vizag', label: 'Visakhapatnam', short: 'Vizag', description: 'Local intelligence that genuinely matters to the city.', parent: 'ap', weight: 5, icon: 'vizag' },
  { slug: 'economy', label: 'Indian Economy', short: 'Economy', description: 'RBI, inflation, budget, trade — explained for citizens and exams.', parent: null, weight: 6, icon: 'economy' },
  { slug: 'ai', label: 'Global AI Developments', short: 'AI', description: 'Models, regulation, semiconductors and AI geopolitics.', parent: null, weight: 5, icon: 'ai' },
  { slug: 'science', label: 'Science, Space & Technology', short: 'Science', description: 'ISRO, NASA, quantum, biotech — difficult science in simple language.', parent: null, weight: 5, icon: 'science' },
  { slug: 'defence', label: 'Defence & National Security', short: 'Defence', description: 'Armed forces, DRDO, exercises, borders and cyber security.', parent: null, weight: 6, icon: 'defence' },
  { slug: 'environment', label: 'Environment & Climate', short: 'Environment', description: 'Climate, biodiversity, pollution and renewable energy.', parent: null, weight: 5, icon: 'environment' },
  { slug: 'government', label: 'Government Schemes & Policies', short: 'Government', description: 'Schemes decoded: ministry, objective, features, exam relevance.', parent: null, weight: 4, icon: 'government' },
  { slug: 'jobs', label: 'Government Jobs & Recruitment', short: 'Jobs', description: 'UPSC, APPSC, SSC, IBPS, RRB — official notifications only.', parent: null, weight: 4, icon: 'jobs' },
  { slug: 'upsc', label: 'UPSC / APPSC Radar', short: 'Exam Prep', description: 'News mapped to GS papers, prelims facts and exam angles.', parent: null, weight: 5, icon: 'upsc' },
];

export const CATEGORY_BY_SLUG: Record<string, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c])
);

/** Flat filters shown on the articles page. */
export const FILTER_CHIPS = [
  'All', 'India', 'World', 'AP', 'Visakhapatnam', 'Politics', 'Economy', 'AI',
  'Science', 'Defence', 'Environment', 'Government', 'Jobs', 'UPSC', 'APPSC',
];

export const TIME_WINDOWS = [
  { slug: '6h', label: 'Last 6 hours', hours: 6 },
  { slug: '24h', label: 'Last 24 hours', hours: 24 },
  { slug: 'today', label: 'Today', hours: -1 },
  { slug: '7d', label: 'Last 7 days', hours: 168 },
] as const;

/** Importance scoring weights (0–100 composite). */
export const SCORING = {
  categoryWeight: 0.25,
  recencyWeight: 0.3,
  sourceWeight: 0.2,
  examWeight: 0.15,
  breadthWeight: 0.1,
  thresholds: { critical: 88, high: 74, medium: 58 },
} as const;

/** Countries surfaced on the geopolitical map. */
export const MAP_COUNTRIES = [
  'India', 'United States', 'China', 'Russia', 'Ukraine', 'Israel', 'Palestine', 'Iran',
  'United Kingdom', 'France', 'Germany', 'Japan', 'Australia', 'Pakistan',
  'Bangladesh', 'Nepal', 'Sri Lanka', 'United Arab Emirates', 'Saudi Arabia',
  'Brazil', 'South Africa', 'Indonesia', 'Singapore', 'Vietnam', 'Canada',
] as const;
