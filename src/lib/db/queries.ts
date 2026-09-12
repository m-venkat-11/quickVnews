import { createHash, randomUUID } from 'node:crypto';
import { db, parseArticleRow } from './index';
import type { Article, DailyBriefing, UpdateRun, FactCapsule, Priority } from '@/lib/types';
import { similarity, normalizeTitle } from '@/lib/utils/text';
import { istDateKey, istSlotKey } from '@/lib/utils/time';

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface ArticleQuery {
  category?: string;
  priority?: Priority;
  hours?: number; // recency window
  q?: string; // search
  page?: number;
  pageSize?: number;
  includeDemo?: boolean;
  runId?: string;
}

interface WhereClause { sql: string; params: (string | number)[] }

function buildWhere(query: ArticleQuery): WhereClause {
  const clauses: string[] = ['1=1'];
  const params: (string | number)[] = [];

  if (query.category && query.category !== 'all' && query.category !== 'top') {
    clauses.push('category = ?');
    params.push(query.category);
  }
  if (query.priority) {
    clauses.push('priority = ?');
    params.push(query.priority);
  }
  if (query.hours && query.hours > 0) {
    clauses.push('published_at >= ?');
    params.push(new Date(Date.now() - query.hours * 3_600_000).toISOString());
  }
  if (query.runId) {
    clauses.push('run_id = ?');
    params.push(query.runId);
  }
  if (query.q) {
    const like = `%${query.q.toLowerCase()}%`;
    clauses.push(
      `(lower(title) LIKE ? OR lower(coalesce(summary,'')) LIKE ? OR lower(coalesce(why_it_matters,'')) LIKE ? OR lower(coalesce(exam_relevance,'')) LIKE ? OR lower(keywords) LIKE ? OR lower(countries) LIKE ? OR lower(entities) LIKE ? OR lower(static_concepts) LIKE ? OR lower(gs_paper) LIKE ?)`
    );
    params.push(like, like, like, like, like, like, like, like, like);
  }
  if (!query.includeDemo) {
    // Demo rows are shown by default (dev/demo mode); callers may hide them.
  }
  return { sql: clauses.join(' AND '), params };
}

export function listArticles(query: ArticleQuery): { items: Article[]; total: number } {
  const d = db();
  const where = buildWhere(query);
  const pageSize = Math.min(60, Math.max(6, query.pageSize ?? 20));
  const page = Math.max(1, query.page ?? 1);

  const totalRow = d.prepare(`SELECT COUNT(*) AS c FROM articles WHERE ${where.sql}`).get(...where.params) as { c: number };
  const rows = d
    .prepare(
      `SELECT * FROM articles WHERE ${where.sql}
       ORDER BY importance DESC, published_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...where.params, pageSize, (page - 1) * pageSize) as Record<string, unknown>[];

  return { items: rows.map(parseArticleRow), total: totalRow.c };
}

export function getArticle(id: string): Article | null {
  const row = db().prepare('SELECT * FROM articles WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? parseArticleRow(row) : null;
}

export function relatedArticles(article: Article, limit = 4): Article[] {
  const d = db();
  const same = d
    .prepare(
      `SELECT * FROM articles WHERE id != ? AND category = ? ORDER BY importance DESC, published_at DESC LIMIT ?`
    )
    .all(article.id, article.category, limit) as Record<string, unknown>[];
  let items = same.map(parseArticleRow);
  if (items.length < limit) {
    const more = d
      .prepare(`SELECT * FROM articles WHERE id != ? AND category != ? ORDER BY importance DESC, published_at DESC LIMIT ?`)
      .all(article.id, article.category, limit - items.length) as Record<string, unknown>[];
    items = items.concat(more.map(parseArticleRow));
  }
  return items;
}

/** Latest-run articles ordered by importance — the TOP DEVELOPMENTS feed. */
export function topDevelopments(limit = 8, runId?: string): Article[] {
  const d = db();
  const run = runId ?? latestRun()?.id;
  if (!run) return [];
  const rows = d
    .prepare(
      `SELECT * FROM articles WHERE run_id = ? ORDER BY importance DESC, published_at DESC LIMIT ?`
    )
    .all(run, limit) as Record<string, unknown>[];
  return rows.map(parseArticleRow);
}

export function articleCount(): number {
  const r = db().prepare('SELECT COUNT(*) AS c FROM articles').get() as { c: number };
  return r.c;
}

// ---------------------------------------------------------------------------
// Dedupe + clustering + save
// ---------------------------------------------------------------------------

function urlHash(url: string): string {
  return createHash('sha256').update(url.trim().toLowerCase()).digest('hex').slice(0, 32);
}

export interface SaveInput {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  sourceTier: number;
  publishedAt: Date;
  runId: string;
  isDemo: boolean;
  processed: Omit<Article, 'id' | 'source_name' | 'source_url' | 'source_tier' | 'sources' | 'published_at' | 'fetched_at' | 'run_id' | 'is_demo'>;
}

export interface SaveOutcome { saved: boolean; duplicateOf?: string; reason?: string }

const SIMILARITY_THRESHOLD = 0.52;

/**
 * Saves one processed item. Dedupe:
 *  1) exact URL hash unique index
 *  2) normalized-title similarity against the last 3 days of articles
 * Clustering: duplicates fold into the existing article as an extra source.
 */
export function saveArticle(input: SaveInput): SaveOutcome {
  const d = db();
  const hash = urlHash(input.url);

  const exact = d.prepare('SELECT id FROM articles WHERE url_hash = ?').get(hash) as { id: string } | undefined;
  if (exact) return { saved: false, duplicateOf: exact.id, reason: 'url' };

  // Strip the demo prefix so all sample items don't share misleading common tokens.
  const titleNorm = normalizeTitle(input.title.replace(/^sample briefing\s*[—-]\s*/i, ''));
  const windowStart = new Date(Date.now() - 72 * 3_600_000).toISOString();
  const recent = d
    .prepare(`SELECT id, title_norm, source_name, source_url FROM articles WHERE published_at >= ? AND title_norm IS NOT NULL`)
    .all(windowStart) as { id: string; title_norm: string; source_name: string; source_url: string }[];

  for (const r of recent) {
    if (similarity(titleNorm, r.title_norm) >= SIMILARITY_THRESHOLD) {
      // Fold into existing article as an additional source (cluster step).
      const existing = d.prepare('SELECT sources FROM articles WHERE id = ?').get(r.id) as { sources: string } | undefined;
      if (existing) {
        try {
          const sources = JSON.parse(existing.sources) as { name: string; url: string }[];
          if (!sources.some((s) => s.url === input.url)) {
            sources.push({ name: input.sourceName, url: input.url });
            d.prepare('UPDATE articles SET sources = ? WHERE id = ?').run(JSON.stringify(sources.slice(0, 5)), r.id);
          }
        } catch { /* keep original sources */ }
      }
      return { saved: false, duplicateOf: r.id, reason: 'similar-title' };
    }
  }

  const p = input.processed;
  d.prepare(
    `INSERT INTO articles (
      id, title, quick_summary, summary, deep_summary, simple_explanation, what_happened, background,
      why_it_matters, india_angle, key_facts, importance, priority, exam_relevance, gs_paper, prelims_fact,
      upsc_angle, static_concepts, category, subcategory, keywords, entities, countries, region,
      source_name, source_url, source_tier, sources, confidence, ai_processed, is_demo, upsc_score,
      url_hash, title_norm, published_at, fetched_at, run_id
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    input.id, input.title, p.quick_summary, p.summary, p.deep_summary, p.simple_explanation, p.what_happened,
    p.background, p.why_it_matters, p.india_angle, JSON.stringify(p.key_facts), p.importance, p.priority,
    p.exam_relevance, p.gs_paper, p.prelims_fact, p.upsc_angle, JSON.stringify(p.static_concepts),
    p.category, p.subcategory, JSON.stringify(p.keywords), JSON.stringify(p.entities), JSON.stringify(p.countries),
    p.region, input.sourceName, input.url, input.sourceTier,
    JSON.stringify([{ name: input.sourceName, url: input.url }]), p.confidence, p.ai_processed,
    input.isDemo ? 1 : 0, 0, hash, titleNorm,
    input.publishedAt.toISOString(), new Date().toISOString(), input.runId
  );
  return { saved: true };
}

// ---------------------------------------------------------------------------
// Update runs
// ---------------------------------------------------------------------------

export function startRun(mode: UpdateRun['mode']): UpdateRun {
  const id = `run_${istSlotKey()}_${randomUUID().slice(0, 8)}`;
  db().prepare(
    `INSERT INTO update_runs (id, started_at, status, mode) VALUES (?, ?, 'running', ?)`
  ).run(id, new Date().toISOString(), mode);
  return getRun(id)!;
}

export function getRun(id: string): UpdateRun | null {
  const row = db().prepare('SELECT * FROM update_runs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    started_at: String(row.started_at),
    finished_at: (row.finished_at as string) ?? null,
    status: row.status as UpdateRun['status'],
    fetched: Number(row.fetched),
    duplicates: Number(row.duplicates),
    processed: Number(row.processed),
    failed_sources: Number(row.failed_sources),
    high_priority: Number(row.high_priority),
    mode: row.mode as UpdateRun['mode'],
    notes: (row.notes as string) ?? null,
  };
}

export function latestRun(): UpdateRun | null {
  const row = db().prepare(`SELECT id FROM update_runs ORDER BY started_at DESC LIMIT 1`).get() as { id: string } | undefined;
  return row ? getRun(row.id) : null;
}

export function finishRun(id: string, stats: Omit<UpdateRun, 'id' | 'started_at' | 'finished_at' | 'status' | 'mode' | 'notes'> & { status: UpdateRun['status']; notes?: string | null }): void {
  db().prepare(
    `UPDATE update_runs SET finished_at = ?, status = ?, fetched = ?, duplicates = ?, processed = ?, failed_sources = ?, high_priority = ?, notes = ? WHERE id = ?`
  ).run(
    new Date().toISOString(), stats.status, stats.fetched, stats.duplicates, stats.processed,
    stats.failed_sources, stats.high_priority, stats.notes ?? null, id
  );
}

// ---------------------------------------------------------------------------
// Daily briefing
// ---------------------------------------------------------------------------

export function getBriefing(date = istDateKey()): DailyBriefing | null {
  const row = db().prepare('SELECT * FROM daily_briefings WHERE date = ?').get(date) as Record<string, unknown> | undefined;
  if (!row) return null;
  try {
    return {
      date: String(row.date),
      run_id: (row.run_id as string) ?? null,
      generated_at: String(row.generated_at),
      headlines: JSON.parse(String(row.headlines)),
      remember: JSON.parse(String(row.remember)),
      sections: JSON.parse(String(row.sections)),
    };
  } catch {
    return null;
  }
}

export function saveBriefing(b: DailyBriefing): void {
  db().prepare(
    `INSERT INTO daily_briefings (date, run_id, generated_at, headlines, remember, sections)
     VALUES (?,?,?,?,?,?)
     ON CONFLICT(date) DO UPDATE SET run_id=excluded.run_id, generated_at=excluded.generated_at,
       headlines=excluded.headlines, remember=excluded.remember, sections=excluded.sections`
  ).run(b.date, b.run_id, b.generated_at, JSON.stringify(b.headlines), JSON.stringify(b.remember), JSON.stringify(b.sections));
}

// ---------------------------------------------------------------------------
// Facts / learning / tools (daily rotation)
// ---------------------------------------------------------------------------

export function factsForDate(date = istDateKey()): { fact: FactCapsule | null; fun: FactCapsule | null; learning: FactCapsule[]; tool: FactCapsule | null } {
  const d = db();
  const rows = d.prepare('SELECT * FROM facts WHERE date = ?').all(date) as Record<string, unknown>[];
  const parse = (r: Record<string, unknown>): FactCapsule => ({
    id: String(r.id), kind: r.kind as FactCapsule['kind'], category: (r.category as string) ?? null,
    title: String(r.title), body: (r.body as string) ?? null, why_it_matters: (r.why_it_matters as string) ?? null,
    context: (r.context as string) ?? null, exam_relevance: (r.exam_relevance as string) ?? null,
    key_fact: (r.key_fact as string) ?? null, meta: safeMeta(r.meta), date: (r.date as string) ?? null,
  });
  const all = rows.map(parse);
  return {
    fact: all.find((f) => f.kind === 'fact') ?? null,
    fun: all.find((f) => f.kind === 'fun') ?? null,
    tool: all.find((f) => f.kind === 'tool') ?? null,
    learning: all.filter((f) => f.kind === 'learning').slice(0, 5),
  };
}

function safeMeta(v: unknown): Record<string, string | null> {
  try {
    const p = typeof v === 'string' ? JSON.parse(v) : v;
    return p && typeof p === 'object' ? (p as Record<string, string | null>) : {};
  } catch { return {}; }
}

/** Rotates pool content onto today's date if not yet assigned. */
export function rotateDailyContent(): void {
  const d = db();
  const today = istDateKey();
  const existing = d.prepare('SELECT COUNT(*) AS c FROM facts WHERE date = ?').get(today) as { c: number };
  if (existing.c > 0) return;

  // Rotate fact: index by day-of-epoch
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const pickKinds = (kind: string, n: number): string[] => {
    const rows = d.prepare(`SELECT id FROM facts WHERE kind = ? AND (date IS NULL OR date != ?) ORDER BY id`).all(kind, today) as { id: string }[];
    if (!rows.length) return [];
    const out: string[] = [];
    for (let i = 0; i < Math.min(n, rows.length); i++) out.push(rows[(dayIndex + i) % rows.length].id);
    return out;
  };

  const assign = (ids: string[], date: string) => {
    for (const id of ids) d.prepare('UPDATE facts SET date = ? WHERE id = ?').run(date, id);
  };

  assign(pickKinds('fact', 1), today);
  assign(pickKinds('fun', 1), today);
  assign(pickKinds('tool', 1), today);
  assign(pickKinds('learning', 4), today);

  // Free older assignments so the pool keeps rotating
  d.prepare(`UPDATE facts SET date = NULL WHERE date IS NOT NULL AND date < ?`).run(
    new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
  );
}

export function allFacts(kind?: string): FactCapsule[] {
  const rows = (kind
    ? db().prepare('SELECT * FROM facts WHERE kind = ? ORDER BY date DESC, id').all(kind)
    : db().prepare('SELECT * FROM facts ORDER BY date DESC, id').all()) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id), kind: r.kind as FactCapsule['kind'], category: (r.category as string) ?? null,
    title: String(r.title), body: (r.body as string) ?? null, why_it_matters: (r.why_it_matters as string) ?? null,
    context: (r.context as string) ?? null, exam_relevance: (r.exam_relevance as string) ?? null,
    key_fact: (r.key_fact as string) ?? null, meta: safeMeta(r.meta), date: (r.date as string) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Bookmarks + prefs (anonymous session via cookie)
// ---------------------------------------------------------------------------

export function getBookmarks(userId: string): { item_type: string; item_id: string; created_at: string }[] {
  return db().prepare('SELECT item_type, item_id, created_at FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as { item_type: string; item_id: string; created_at: string }[];
}

export function toggleBookmark(userId: string, itemType: string, itemId: string): { bookmarked: boolean } {
  const d = db();
  const existing = d.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(userId, itemType, itemId) as { id: number } | undefined;
  if (existing) {
    d.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
    return { bookmarked: false };
  }
  d.prepare('INSERT INTO bookmarks (user_id, item_type, item_id) VALUES (?,?,?)').run(userId, itemType, itemId);
  return { bookmarked: true };
}

export function isBookmarked(userId: string, itemType: string, itemId: string): boolean {
  return Boolean(db().prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(userId, itemType, itemId));
}

export function bookmarkedArticles(userId: string): Article[] {
  const rows = db().prepare(
    `SELECT a.* FROM bookmarks b JOIN articles a ON a.id = b.item_id
     WHERE b.user_id = ? AND b.item_type = 'article' ORDER BY b.created_at DESC`
  ).all(userId) as Record<string, unknown>[];
  return rows.map(parseArticleRow);
}

export function getPrefs(userId: string): { exam: string; location: string; topics: string[]; explain_level: string } {
  const row = db().prepare('SELECT * FROM user_prefs WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!row) return { exam: 'All', location: 'India', topics: [], explain_level: 'standard' };
  let topics: string[] = [];
  try { topics = JSON.parse(String(row.topics)); } catch { /* default */ }
  return {
    exam: String(row.exam), location: String(row.location), topics,
    explain_level: String(row.explain_level),
  };
}

export function setPrefs(userId: string, prefs: Partial<{ exam: string; location: string; topics: string[]; explain_level: string; theme: string }>): void {
  const current = getPrefs(userId);
  db().prepare(
    `INSERT INTO user_prefs (user_id, exam, location, topics, explain_level, theme, updated_at)
     VALUES (?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET exam=excluded.exam, location=excluded.location, topics=excluded.topics,
       explain_level=excluded.explain_level, theme=excluded.theme, updated_at=datetime('now')`
  ).run(
    userId, prefs.exam ?? current.exam, prefs.location ?? current.location,
    JSON.stringify(prefs.topics ?? current.topics), prefs.explain_level ?? current.explain_level,
    prefs.theme ?? 'dark'
  );
}

// ---------------------------------------------------------------------------
// Sources table sync
// ---------------------------------------------------------------------------

export function syncSources(catalog: { name: string; url: string; kind: string; tier: number; categories: string[] }[]): void {
  const d = db();
  for (const s of catalog) {
    d.prepare(
      `INSERT INTO sources (name, url, kind, tier, categories) VALUES (?,?,?,?,?)
       ON CONFLICT(name) DO UPDATE SET url=excluded.url, tier=excluded.tier, categories=excluded.categories`
    ).run(s.name, s.url, s.kind, s.tier, JSON.stringify(s.categories));
  }
}

export function recordSourceFetch(name: string, ok: boolean, status: string): void {
  const d = db();
  if (ok) {
    d.prepare(`UPDATE sources SET last_status = ?, last_fetched_at = ?, fail_count = 0 WHERE name = ?`)
      .run(status, new Date().toISOString(), name);
  } else {
    d.prepare(`UPDATE sources SET last_status = ?, fail_count = fail_count + 1,
      enabled = CASE WHEN fail_count + 1 >= 5 THEN 0 ELSE enabled END WHERE name = ?`)
      .run(status, name);
  }
}

export function sourceStats(): { total: number; enabled: number; failing: number } {
  const r = db().prepare(`SELECT COUNT(*) AS total,
    SUM(CASE WHEN enabled=1 THEN 1 ELSE 0 END) AS enabled,
    SUM(CASE WHEN fail_count > 0 THEN 1 ELSE 0 END) AS failing FROM sources`).get() as Record<string, number>;
  return { total: r.total ?? 0, enabled: r.enabled ?? 0, failing: r.failing ?? 0 };
}

// ---------------------------------------------------------------------------
// FTS5 full-text search
// ---------------------------------------------------------------------------

export function searchArticlesFTS(query: string, hours?: number, limit = 30): { items: Article[]; total: number } {
  const d = db();
  // Sanitize FTS5 query: escape special chars and add * for prefix matching
  const terms = query.trim().split(/\s+/).filter(Boolean).map(t =>
    `"${t.replace(/"/g, '""')}"`
  ).join(' ');

  if (!terms) return { items: [], total: 0 };

  try {
    let sql = `SELECT a.* FROM articles_fts f
      JOIN articles a ON a.rowid = f.rowid
      WHERE articles_fts MATCH ?`;
    const params: (string | number)[] = [terms];

    if (hours && hours > 0) {
      sql += ` AND a.published_at >= ?`;
      params.push(new Date(Date.now() - hours * 3_600_000).toISOString());
    }

    sql += ` ORDER BY bm25(articles_fts) LIMIT ?`;
    params.push(limit);

    const rows = d.prepare(sql).all(...params) as Record<string, unknown>[];
    const items = rows.map(parseArticleRow);

    // Count
    let countSql = `SELECT COUNT(*) AS c FROM articles_fts f
      JOIN articles a ON a.rowid = f.rowid
      WHERE articles_fts MATCH ?`;
    const countParams: (string | number)[] = [terms];
    if (hours && hours > 0) {
      countSql += ` AND a.published_at >= ?`;
      countParams.push(new Date(Date.now() - hours * 3_600_000).toISOString());
    }
    const total = (d.prepare(countSql).get(...countParams) as { c: number }).c;

    return { items, total };
  } catch {
    // FTS table might not be populated yet — fall back to LIKE
    return listArticles({ q: query, hours, pageSize: limit });
  }
}

/** Rebuild the FTS index from scratch (run after DB migration). */
export function rebuildFTSIndex(): void {
  const d = db();
  try {
    d.exec(`INSERT INTO articles_fts(articles_fts) VALUES('rebuild')`);
  } catch {
    // FTS table may not exist yet
  }
}

// ---------------------------------------------------------------------------
// Read tracking
// ---------------------------------------------------------------------------

export function markRead(userId: string, articleId: string, timeSpentMs = 0): void {
  db().prepare(
    `INSERT INTO read_history (user_id, article_id, read_at, time_spent_ms)
     VALUES (?, ?, datetime('now'), ?)
     ON CONFLICT(user_id, article_id) DO UPDATE SET
       read_at = datetime('now'),
       time_spent_ms = read_history.time_spent_ms + excluded.time_spent_ms`
  ).run(userId, articleId, timeSpentMs);
}

export function getReadIds(userId: string): Set<string> {
  const rows = db().prepare('SELECT article_id FROM read_history WHERE user_id = ?')
    .all(userId) as { article_id: string }[];
  return new Set(rows.map(r => r.article_id));
}

export function isRead(userId: string, articleId: string): boolean {
  return Boolean(db().prepare('SELECT 1 FROM read_history WHERE user_id = ? AND article_id = ?')
    .get(userId, articleId));
}

export function readingStats(userId: string): {
  totalRead: number;
  thisWeek: number;
  byCategory: { category: string; count: number }[];
  streak: number;
} {
  const d = db();
  const totalRow = d.prepare('SELECT COUNT(*) AS c FROM read_history WHERE user_id = ?').get(userId) as { c: number };
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const weekRow = d.prepare('SELECT COUNT(*) AS c FROM read_history WHERE user_id = ? AND read_at >= ?').get(userId, weekAgo) as { c: number };

  const byCategory = d.prepare(
    `SELECT a.category, COUNT(*) AS count FROM read_history r
     JOIN articles a ON a.id = r.article_id
     WHERE r.user_id = ? GROUP BY a.category ORDER BY count DESC LIMIT 6`
  ).all(userId) as { category: string; count: number }[];

  // Calculate streak: consecutive days with at least one read
  const days = d.prepare(
    `SELECT DISTINCT date(read_at) AS d FROM read_history WHERE user_id = ? ORDER BY d DESC LIMIT 60`
  ).all(userId) as { d: string }[];

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    if (days[i]?.d === expected) streak++;
    else break;
  }

  return { totalRead: totalRow.c, thisWeek: weekRow.c, byCategory, streak };
}

// ---------------------------------------------------------------------------
// Spaced-repetition (SM-2 algorithm)
// ---------------------------------------------------------------------------

export interface ReviewItem {
  id: number;
  item_type: string;
  item_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  last_reviewed: string | null;
  last_quality: number | null;
}

/** Get items due for review today or earlier. */
export function getDueReviews(userId: string, limit = 20): ReviewItem[] {
  const today = new Date().toISOString().slice(0, 10);
  return db().prepare(
    `SELECT * FROM review_schedule WHERE user_id = ? AND next_review <= ? ORDER BY next_review ASC LIMIT ?`
  ).all(userId, today, limit) as unknown as ReviewItem[];
}

/** Get all review items for a user. */
export function getAllReviews(userId: string): ReviewItem[] {
  return db().prepare(
    `SELECT * FROM review_schedule WHERE user_id = ? ORDER BY next_review ASC`
  ).all(userId) as unknown as ReviewItem[];
}

/** Add an item to the spaced-repetition schedule. */
export function addToReview(userId: string, itemType: string, itemId: string): void {
  const today = new Date().toISOString().slice(0, 10);
  db().prepare(
    `INSERT INTO review_schedule (user_id, item_type, item_id, next_review)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, item_type, item_id) DO NOTHING`
  ).run(userId, itemType, itemId, today);
}

/** Remove an item from review schedule. */
export function removeFromReview(userId: string, itemType: string, itemId: string): void {
  db().prepare(
    `DELETE FROM review_schedule WHERE user_id = ? AND item_type = ? AND item_id = ?`
  ).run(userId, itemType, itemId);
}

/**
 * SM-2 algorithm: process a review rating (0-5).
 * 0-2 = failed (reset), 3 = hard, 4 = good, 5 = easy
 */
export function processReview(userId: string, itemType: string, itemId: string, quality: number): void {
  const d = db();
  const row = d.prepare(
    `SELECT * FROM review_schedule WHERE user_id = ? AND item_type = ? AND item_id = ?`
  ).get(userId, itemType, itemId) as ReviewItem | undefined;

  if (!row) {
    addToReview(userId, itemType, itemId);
    return;
  }

  let { ease_factor: ef, interval_days: interval, repetitions: reps } = row;

  if (quality < 3) {
    // Failed: reset
    reps = 0;
    interval = 1;
  } else {
    // Passed
    reps += 1;
    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * ef);
    }
  }

  // Update ease factor (SM-2 formula)
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ef = Math.max(1.3, ef); // minimum EF

  const nextReview = new Date(Date.now() + interval * 86_400_000).toISOString().slice(0, 10);

  d.prepare(
    `UPDATE review_schedule SET
      ease_factor = ?, interval_days = ?, repetitions = ?,
      next_review = ?, last_reviewed = datetime('now'), last_quality = ?
     WHERE user_id = ? AND item_type = ? AND item_id = ?`
  ).run(ef, interval, reps, nextReview, quality, userId, itemType, itemId);
}

/** Review stats for a user. */
export function reviewStats(userId: string): { total: number; due: number; mastered: number } {
  const d = db();
  const today = new Date().toISOString().slice(0, 10);
  const total = (d.prepare('SELECT COUNT(*) AS c FROM review_schedule WHERE user_id = ?').get(userId) as { c: number }).c;
  const due = (d.prepare('SELECT COUNT(*) AS c FROM review_schedule WHERE user_id = ? AND next_review <= ?').get(userId, today) as { c: number }).c;
  const mastered = (d.prepare('SELECT COUNT(*) AS c FROM review_schedule WHERE user_id = ? AND interval_days >= 21').get(userId) as { c: number }).c;
  return { total, due, mastered };
}

export function newId(): string {
  return randomUUID();
}
