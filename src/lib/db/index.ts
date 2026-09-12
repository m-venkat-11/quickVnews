import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { DB_PATH, CATEGORIES } from '@/lib/config';
import { seedIfEmpty } from './seed';
import { SOURCE_CATALOG } from '@/lib/news/sources';
import { DEMO_TEMPLATES } from '@/lib/news/demo';
import { istDateKey } from '@/lib/utils/time';

let _db: DatabaseSync | null = null;

/** Singleton connection. Uses WAL or DELETE journal mode with automatic Vercel /tmp path support. */
export function db(): DatabaseSync {
  if (_db) return _db;
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const targetPath = DB_PATH || (isVercel ? '/tmp/prism.db' : 'data/prism.db');
  const path = isAbsolute(targetPath) ? targetPath : resolve(process.cwd(), targetPath);

  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {
    // Read-only or directory already exists
  }

  _db = new DatabaseSync(path);
  try {
    _db.exec('PRAGMA journal_mode = WAL;');
  } catch {
    try {
      _db.exec('PRAGMA journal_mode = DELETE;');
    } catch {
      // Safe fallback
    }
  }
  _db.exec('PRAGMA foreign_keys = ON;');
  migrate(_db);
  autoSeed(_db);
  return _db;
}

function migrate(d: DatabaseSync): void {
  d.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    quick_summary TEXT,
    summary TEXT,
    deep_summary TEXT,
    simple_explanation TEXT,
    what_happened TEXT,
    background TEXT,
    why_it_matters TEXT,
    india_angle TEXT,
    key_facts TEXT,               -- JSON array
    importance INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    exam_relevance TEXT,
    gs_paper TEXT,
    prelims_fact TEXT,
    upsc_angle TEXT,
    static_concepts TEXT,         -- JSON array
    category TEXT NOT NULL,
    subcategory TEXT,
    keywords TEXT,                -- JSON array
    entities TEXT,                -- JSON array
    countries TEXT,               -- JSON array
    region TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_tier INTEGER NOT NULL DEFAULT 3,
    sources TEXT,                 -- JSON array of {name,url}
    confidence TEXT,
    ai_processed INTEGER NOT NULL DEFAULT 0,
    is_demo INTEGER NOT NULL DEFAULT 0,
    upsc_score INTEGER NOT NULL DEFAULT 0,
    url_hash TEXT UNIQUE,         -- dedupe key
    title_norm TEXT,              -- normalized title for similarity dedupe
    published_at TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    run_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category, published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_priority ON articles(priority, importance DESC);
  CREATE INDEX IF NOT EXISTS idx_articles_run ON articles(run_id);
  CREATE INDEX IF NOT EXISTS idx_articles_title_norm ON articles(title_norm);

  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'rss',
    tier INTEGER NOT NULL DEFAULT 3,
    categories TEXT NOT NULL DEFAULT '[]',   -- JSON array
    enabled INTEGER NOT NULL DEFAULT 1,
    last_status TEXT,
    last_fetched_at TEXT,
    fail_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    slug TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    short TEXT NOT NULL,
    description TEXT NOT NULL,
    parent TEXT,
    weight INTEGER NOT NULL DEFAULT 3,
    icon TEXT NOT NULL DEFAULT 'doc'
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_prefs (
    user_id TEXT PRIMARY KEY,
    exam TEXT NOT NULL DEFAULT 'All',
    location TEXT NOT NULL DEFAULT 'India',
    topics TEXT NOT NULL DEFAULT '[]',
    theme TEXT NOT NULL DEFAULT 'dark',
    explain_level TEXT NOT NULL DEFAULT 'standard',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'article',  -- article | fact | learning | tool
    item_id TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, item_type, item_id)
  );
  CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, item_type);

  CREATE TABLE IF NOT EXISTS daily_briefings (
    date TEXT PRIMARY KEY,                       -- IST YYYY-MM-DD
    run_id TEXT,
    generated_at TEXT NOT NULL,
    headlines TEXT NOT NULL,                     -- JSON array
    remember TEXT NOT NULL,                      -- JSON array (5 things)
    sections TEXT NOT NULL                       -- JSON array of {key,title,articleIds}
  );

  CREATE TABLE IF NOT EXISTS exam_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT UNIQUE NOT NULL,
    kind TEXT NOT NULL DEFAULT 'gs',             -- gs | prelims | optional | state
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS update_runs (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL DEFAULT 'running',
    fetched INTEGER NOT NULL DEFAULT 0,
    duplicates INTEGER NOT NULL DEFAULT 0,
    processed INTEGER NOT NULL DEFAULT 0,
    failed_sources INTEGER NOT NULL DEFAULT 0,
    high_priority INTEGER NOT NULL DEFAULT 0,
    mode TEXT NOT NULL DEFAULT 'demo',
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_runs_started ON update_runs(started_at DESC);

  CREATE TABLE IF NOT EXISTS ai_tools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    what TEXT NOT NULL,
    best_for TEXT NOT NULL,
    free_limits TEXT,
    why_students TEXT,
    safe INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS facts (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,                          -- fact | learning | fun | tool
    category TEXT,
    title TEXT NOT NULL,
    body TEXT,
    why_it_matters TEXT,
    context TEXT,
    exam_relevance TEXT,
    key_fact TEXT,
    meta TEXT,                                   -- JSON object
    date TEXT                                    -- assigned IST date
  );
  CREATE INDEX IF NOT EXISTS idx_facts_date ON facts(date, kind);

  -- FTS5 full-text search virtual table
  CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    title, summary, why_it_matters, exam_relevance,
    keywords, countries, entities, gs_paper, static_concepts,
    content='articles', content_rowid='rowid',
    tokenize='porter unicode61'
  );

  -- Triggers to keep FTS in sync with the articles table
  CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
    INSERT INTO articles_fts(rowid, title, summary, why_it_matters, exam_relevance,
      keywords, countries, entities, gs_paper, static_concepts)
    VALUES (new.rowid, new.title, new.summary, new.why_it_matters, new.exam_relevance,
      new.keywords, new.countries, new.entities, new.gs_paper, new.static_concepts);
  END;
  CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, summary, why_it_matters, exam_relevance,
      keywords, countries, entities, gs_paper, static_concepts)
    VALUES ('delete', old.rowid, old.title, old.summary, old.why_it_matters, old.exam_relevance,
      old.keywords, old.countries, old.entities, old.gs_paper, old.static_concepts);
  END;
  CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
    INSERT INTO articles_fts(articles_fts, rowid, title, summary, why_it_matters, exam_relevance,
      keywords, countries, entities, gs_paper, static_concepts)
    VALUES ('delete', old.rowid, old.title, old.summary, old.why_it_matters, old.exam_relevance,
      old.keywords, old.countries, old.entities, old.gs_paper, old.static_concepts);
    INSERT INTO articles_fts(rowid, title, summary, why_it_matters, exam_relevance,
      keywords, countries, entities, gs_paper, static_concepts)
    VALUES (new.rowid, new.title, new.summary, new.why_it_matters, new.exam_relevance,
      new.keywords, new.countries, new.entities, new.gs_paper, new.static_concepts);
  END;

  -- Read tracking
  CREATE TABLE IF NOT EXISTS read_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    article_id TEXT NOT NULL,
    read_at TEXT NOT NULL DEFAULT (datetime('now')),
    time_spent_ms INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, article_id)
  );
  CREATE INDEX IF NOT EXISTS idx_read_user ON read_history(user_id, read_at DESC);

  -- Spaced-repetition review schedule (SM-2 algorithm)
  CREATE TABLE IF NOT EXISTS review_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'article',   -- article | fact
    item_id TEXT NOT NULL,
    ease_factor REAL NOT NULL DEFAULT 2.5,       -- SM-2 ease factor
    interval_days INTEGER NOT NULL DEFAULT 1,    -- days until next review
    repetitions INTEGER NOT NULL DEFAULT 0,      -- consecutive correct
    next_review TEXT NOT NULL,                   -- ISO date of next review
    last_reviewed TEXT,
    last_quality INTEGER,                        -- last quality rating (0-5)
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, item_type, item_id)
  );
  CREATE INDEX IF NOT EXISTS idx_review_due ON review_schedule(user_id, next_review);
  `);
}

/** Row → typed record with JSON columns parsed. */
export function parseArticleRow(row: Record<string, unknown>): import('@/lib/types').Article {
  const j = (v: unknown, fb: string[] = []): string[] => {
    try {
      const parsed = typeof v === 'string' ? JSON.parse(v) : v;
      return Array.isArray(parsed) ? parsed.map(String) : fb;
    } catch {
      return fb;
    }
  };
  return {
    id: String(row.id),
    title: String(row.title),
    quick_summary: (row.quick_summary as string) ?? null,
    summary: (row.summary as string) ?? null,
    deep_summary: (row.deep_summary as string) ?? null,
    simple_explanation: (row.simple_explanation as string) ?? null,
    what_happened: (row.what_happened as string) ?? null,
    background: (row.background as string) ?? null,
    why_it_matters: (row.why_it_matters as string) ?? null,
    india_angle: (row.india_angle as string) ?? null,
    key_facts: j(row.key_facts),
    importance: Number(row.importance ?? 0),
    priority: (row.priority as import('@/lib/types').Priority) ?? 'MEDIUM',
    exam_relevance: (row.exam_relevance as string) ?? null,
    gs_paper: (row.gs_paper as string) ?? null,
    prelims_fact: (row.prelims_fact as string) ?? null,
    upsc_angle: (row.upsc_angle as string) ?? null,
    static_concepts: j(row.static_concepts),
    category: String(row.category),
    subcategory: (row.subcategory as string) ?? null,
    keywords: j(row.keywords),
    entities: j(row.entities),
    countries: j(row.countries),
    region: (row.region as string) ?? null,
    source_name: String(row.source_name),
    source_url: String(row.source_url),
    source_tier: Number(row.source_tier ?? 3),
    sources: (() => {
      try {
        const parsed = typeof row.sources === 'string' ? JSON.parse(row.sources) : row.sources;
        return Array.isArray(parsed) ? parsed : [{ name: String(row.source_name), url: String(row.source_url) }];
      } catch {
        return [{ name: String(row.source_name), url: String(row.source_url) }];
      }
    })(),
    confidence: (row.confidence as import('@/lib/types').Confidence) ?? null,
    ai_processed: Number(row.ai_processed ?? 0) as 0 | 1,
    is_demo: Number(row.is_demo ?? 0) as 0 | 1,
    published_at: String(row.published_at),
    fetched_at: String(row.fetched_at),
    run_id: (row.run_id as string) ?? null,
  };
}

/** Automatically seeds categories, sources, facts, and initial sample articles if DB is fresh. */
function autoSeed(d: DatabaseSync): void {
  try {
    // 1. Categories
    const catCount = (d.prepare('SELECT COUNT(*) AS c FROM categories').get() as { c: number })?.c ?? 0;
    if (catCount === 0) {
      const insertCat = d.prepare(
        `INSERT INTO categories (slug, label, short, description, parent, weight, icon)
         VALUES (?,?,?,?,?,?,?)
         ON CONFLICT(slug) DO UPDATE SET label=excluded.label, short=excluded.short, description=excluded.description`
      );
      for (const c of CATEGORIES) {
        insertCat.run(c.slug, c.label, c.short, c.description, c.parent, c.weight, c.icon);
      }
    }

    // 2. Sources
    const srcCount = (d.prepare('SELECT COUNT(*) AS c FROM sources').get() as { c: number })?.c ?? 0;
    if (srcCount === 0) {
      const insSrc = d.prepare(
        `INSERT INTO sources (name, url, kind, tier, categories) VALUES (?,?,?,?,?)
         ON CONFLICT(name) DO UPDATE SET url=excluded.url, tier=excluded.tier, categories=excluded.categories`
      );
      for (const s of SOURCE_CATALOG) {
        insSrc.run(s.name, s.url, s.kind, s.tier, JSON.stringify(s.categories));
      }
    }

    // 3. Facts
    seedIfEmpty();

    // 4. Rotate daily facts
    rotateDailyFacts(d);

    // 5. Initial Articles
    const artCount = (d.prepare('SELECT COUNT(*) AS c FROM articles').get() as { c: number })?.c ?? 0;
    if (artCount === 0) {
      seedInitialArticles(d);
      // Trigger background live ingest from all sources
      setTimeout(() => {
        import('@/lib/news/ingest')
          .then(({ runIngestion }) => runIngestion('live'))
          .catch(() => {});
      }, 100);
    }
  } catch (err) {
    console.error('Auto-seed error:', err);
  }
}

function rotateDailyFacts(d: DatabaseSync): void {
  try {
    const today = istDateKey();
    const existing = d.prepare('SELECT COUNT(*) AS c FROM facts WHERE date = ?').get(today) as { c: number };
    if (existing && existing.c > 0) return;

    const dayIndex = Math.floor(Date.now() / 86_400_000);
    for (const kind of ['fact', 'fun', 'learning', 'tool']) {
      const rows = d.prepare(`SELECT id FROM facts WHERE kind = ? AND (date IS NULL OR date != ?) ORDER BY id`).all(kind, today) as { id: string }[];
      if (!rows.length) continue;
      const n = kind === 'learning' ? 5 : 1;
      for (let i = 0; i < Math.min(n, rows.length); i++) {
        const id = rows[(dayIndex + i) % rows.length].id;
        d.prepare('UPDATE facts SET date = ? WHERE id = ?').run(today, id);
      }
    }
  } catch {}
}

function seedInitialArticles(d: DatabaseSync): void {
  try {
    const insert = d.prepare(`
      INSERT INTO articles (
        id, title, quick_summary, summary, why_it_matters, india_angle,
        key_facts, importance, priority, exam_relevance, gs_paper,
        category, source_name, source_url, source_tier, confidence,
        ai_processed, is_demo, published_at, fetched_at, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, datetime('now')
      )
      ON CONFLICT(id) DO NOTHING
    `);

    const gsMap: Record<string, string> = {
      economy: 'GS-III',
      government: 'GS-II',
      science: 'GS-III',
      world: 'GS-II',
      ap: 'APPSC',
      vizag: 'APPSC',
      ai: 'GS-III',
      defence: 'GS-III',
      environment: 'GS-III',
      politics: 'GS-II',
      jobs: 'UPSC / APPSC',
      india: 'GS-II',
    };

    const now = new Date();
    DEMO_TEMPLATES.forEach((t, i) => {
      const id = `art_demo_${i + 1}`;
      const pubTime = new Date(now.getTime() - i * 3600_000).toISOString();
      const gs = gsMap[t.category] || 'GS-II';
      insert.run(
        id,
        t.title,
        t.description.slice(0, 160),
        t.description,
        `Direct impact on ${t.category} governance and syllabus relevance for ${gs}.`,
        `Key development relevant for competitive examinations in India.`,
        JSON.stringify([t.title.replace(/^Sample briefing — /, ''), `Source: ${t.sourceName}`]),
        75,
        i < 4 ? 'HIGH' : 'MEDIUM',
        `${gs} — Current Affairs & Mains analytical anchor`,
        gs,
        t.category,
        t.sourceName,
        t.sourceUrl,
        t.sourceTier,
        'source-verified',
        1,
        1,
        pubTime,
        pubTime
      );
    });

    try {
      d.exec(`INSERT INTO articles_fts(articles_fts) VALUES('rebuild')`);
    } catch {}
  } catch (err) {
    console.error('Error seeding initial articles:', err);
  }
}

