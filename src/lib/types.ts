/** Shared domain types for PRISM CURRENT. */

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Confidence = 'official' | 'multi-source' | 'source-verified' | 'developing' | 'reports-differ';

export interface Article {
  id: string;
  title: string;
  quick_summary: string | null;
  summary: string | null;
  deep_summary: string | null;
  simple_explanation: string | null;
  what_happened: string | null;
  background: string | null;
  why_it_matters: string | null;
  india_angle: string | null;
  key_facts: string[];
  importance: number;
  priority: Priority;
  exam_relevance: string | null;
  gs_paper: string | null;
  prelims_fact: string | null;
  upsc_angle: string | null;
  static_concepts: string[];
  category: string;
  subcategory: string | null;
  keywords: string[];
  entities: string[];
  countries: string[];
  region: string | null;
  source_name: string;
  source_url: string;
  source_tier: number; // 1 = official/primary, 2 = reputable, 3 = general
  sources: { name: string; url: string }[];
  confidence: Confidence | null;
  ai_processed: 0 | 1;
  is_demo: 0 | 1;
  published_at: string; // ISO
  fetched_at: string; // ISO
  run_id: string | null;
}

export interface UpdateRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: 'running' | 'success' | 'partial' | 'failed';
  fetched: number;
  duplicates: number;
  processed: number;
  failed_sources: number;
  high_priority: number;
  mode: 'live' | 'demo' | 'manual';
  notes: string | null;
}

export interface BriefingSection {
  key: string;
  title: string;
  articleIds: string[];
}

export interface DailyBriefing {
  date: string; // YYYY-MM-DD (IST)
  run_id: string | null;
  generated_at: string;
  headlines: string[];
  remember: string[]; // "5 things you should remember today"
  sections: BriefingSection[];
}

export interface FactCapsule {
  id: string;
  kind: 'fact' | 'learning' | 'fun' | 'tool';
  category: string | null;
  title: string;
  body: string | null;
  why_it_matters: string | null;
  context: string | null;
  exam_relevance: string | null;
  key_fact: string | null;
  meta: Record<string, string | null>; // e.g. tool url / free limits
  date: string | null; // assigned IST date for daily rotation
}

export interface SourceDef {
  id: number;
  name: string;
  url: string;
  kind: 'rss' | 'official' | 'api';
  tier: number;
  categories: string[];
  enabled: 0 | 1;
  last_status: string | null;
  last_fetched_at: string | null;
  fail_count: number;
}

export interface UserPrefs {
  exam: string;
  location: string;
  topics: string[];
  theme: 'dark' | 'light';
  explainLevel: 'quick' | 'standard' | 'deep';
}

export interface PagedArticles {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TopicPageData {
  slug: string;
  label: string;
  description: string;
  items: Article[];
  total: number;
}
