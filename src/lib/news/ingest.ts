import { db } from '@/lib/db/index';
import { parseArticleRow } from '@/lib/db/index';
import {
  startRun, finishRun, saveArticle, saveBriefing, syncSources, recordSourceFetch,
  newId, getRun, getBriefing, rotateDailyContent,
} from '@/lib/db/queries';
import type { Article, BriefingSection, DailyBriefing, UpdateRun } from '@/lib/types';
import { SOURCE_CATALOG } from './sources';
import { fetchFeed } from './rss';
import { demoRawItems } from './demo';
import { processItem } from '@/lib/ai/processor';
import { istDateKey, istSlotKey } from '@/lib/utils/time';

export interface IngestResult {
  runId: string;
  status: UpdateRun['status'];
  fetched: number;
  duplicates: number;
  processed: number;
  failedSources: number;
  highPriority: number;
  mode: UpdateRun['mode'];
  notes: string | null;
}

const MAX_PER_SOURCE = 12;
const MAX_LIVE_ITEMS = 60;

/** Stable cycle index per 6-hour IST slot, so demo cycles rotate deterministically. */
function slotCycleIndex(slotKey: string): number {
  const [date, hour] = slotKey.split('T');
  const days = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 86_400_000);
  return days * 4 + Math.floor(Number(hour) / 6);
}

interface BatchItem {
  title: string;
  url: string;
  sourceName: string;
  sourceTier: number;
  description: string | null;
  publishedAt: Date;
  isDemo: boolean;
  declaredCategory?: string;
}

async function saveBatch(batch: BatchItem[], runId: string): Promise<{ fetched: number; duplicates: number; processed: number; highPriority: number }> {
  let fetched = 0, duplicates = 0, processed = 0, highPriority = 0;
  for (const item of batch) {
    try {
      const p = await processItem({
        title: item.title, url: item.url, sourceName: item.sourceName, sourceTier: item.sourceTier,
        description: item.description, publishedAt: item.publishedAt, isDemo: item.isDemo,
        declaredCategory: item.declaredCategory,
      });
      const outcome = saveArticle({
        id: newId(), title: p.title, url: item.url, sourceName: item.sourceName,
        sourceTier: item.sourceTier, publishedAt: item.publishedAt, runId,
        isDemo: item.isDemo, processed: p,
      });
      fetched++;
      if (outcome.saved) {
        processed++;
        if (p.priority === 'CRITICAL' || p.priority === 'HIGH') highPriority++;
      } else {
        duplicates++;
      }
    } catch {
      fetched++;
      duplicates++;
    }
  }
  return { fetched, duplicates, processed, highPriority };
}

/**
 * Runs one full update cycle.
 * 'live'/'manual': fetch real sources (network-gated), fall back to a labelled demo cycle.
 * 'demo': deterministic offline cycle — no network.
 */
export async function runIngestion(mode: 'live' | 'demo' | 'manual' = 'live'): Promise<IngestResult> {
  syncSources(SOURCE_CATALOG);
  const run = startRun(mode);
  let fetched = 0, duplicates = 0, processed = 0, failedSources = 0, highPriority = 0;
  const failures: string[] = [];

  if (mode === 'live' || mode === 'manual') {
    const batch: BatchItem[] = [];
    const results = await Promise.allSettled(
      SOURCE_CATALOG.map(async (src) => {
        const { items, error } = await fetchFeed(src.url);
        recordSourceFetch(src.name, !error, error ?? `OK (${items.length} items)`);
        if (error) {
          failures.push(`${src.name}: ${error}`);
          return;
        }
        for (const it of items.slice(0, MAX_PER_SOURCE)) {
          batch.push({
            title: it.title, url: it.url, sourceName: src.name, sourceTier: src.tier,
            description: it.description, publishedAt: it.publishedAt, isDemo: false,
            declaredCategory: src.categories[0],
          });
        }
      })
    );
    void results;
    failedSources = failures.length;

    const cutoff = Date.now() - 24 * 3_600_000;
    const recent = batch
      .filter((b) => b.publishedAt.getTime() >= cutoff)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, MAX_LIVE_ITEMS);

    const stats = await saveBatch(recent, run.id);
    fetched = stats.fetched; duplicates = stats.duplicates; processed = stats.processed; highPriority = stats.highPriority;

    // Graceful degradation — never show an empty dashboard, never invent "live" news.
    if (processed === 0) {
      const demoItems = demoRawItems(slotCycleIndex(istSlotKey()), new Date()).map<BatchItem>((r) => ({
        title: r.title, url: r.url, sourceName: r.sourceName, sourceTier: r.sourceTier,
        description: r.description ?? null, publishedAt: r.publishedAt, isDemo: true,
        declaredCategory: r.declaredCategory,
      }));
      const dstats = await saveBatch(demoItems, run.id);
      fetched += dstats.fetched; duplicates += dstats.duplicates; processed += dstats.processed; highPriority += dstats.highPriority;
      finishRun(run.id, {
        status: 'partial', fetched, duplicates, processed,
        failed_sources: failedSources, high_priority: highPriority,
        notes: failures.length
          ? `Live sources unavailable (${failures.slice(0, 3).join('; ')}). Serving labelled sample cycle — last confirmed live update unchanged.`
          : 'Live sources returned no recent items. Serving labelled sample cycle.',
      });
    } else {
      finishRun(run.id, {
        status: failures.length ? 'partial' : 'success',
        fetched, duplicates, processed, failed_sources: failedSources, high_priority: highPriority,
        notes: failures.length ? failures.slice(0, 5).join('; ') : null,
      });
    }
  } else {
    // ---- demo mode: deterministic, offline --------------------------------
    const demoItems = demoRawItems(slotCycleIndex(istSlotKey()), new Date()).map<BatchItem>((r) => ({
      title: r.title, url: r.url, sourceName: r.sourceName, sourceTier: r.sourceTier,
      description: r.description ?? null, publishedAt: r.publishedAt, isDemo: true,
      declaredCategory: r.declaredCategory,
    }));
    const dstats = await saveBatch(demoItems, run.id);
    fetched = dstats.fetched; duplicates = dstats.duplicates; processed = dstats.processed; highPriority = dstats.highPriority;
    finishRun(run.id, {
      status: 'success', fetched, duplicates, processed, failed_sources: 0,
      high_priority: highPriority,
      notes: 'Demo cycle — sample content, labelled SAMPLE in the UI.',
    });
  }

  generateBriefing(run.id);
  rotateDailyContent();

  const finalRun = getRun(run.id)!;
  return {
    runId: run.id,
    status: finalRun.status,
    fetched: finalRun.fetched,
    duplicates: finalRun.duplicates,
    processed: finalRun.processed,
    failedSources: finalRun.failed_sources,
    highPriority: finalRun.high_priority,
    mode: finalRun.mode,
    notes: finalRun.notes,
  };
}

/**
 * Builds the daily briefing for a run: top headlines, section splits and
 * "5 things you should remember today".
 */
export function generateBriefing(runId: string): void {
  const rows = db()
    .prepare(`SELECT * FROM articles WHERE run_id = ? ORDER BY importance DESC, published_at DESC`)
    .all(runId) as Record<string, unknown>[];
  const arts = rows.map(parseArticleRow);
  if (!arts.length) return;

  const byCategory = (cats: string[], n: number): Article[] =>
    arts.filter((a) => cats.includes(a.category)).slice(0, n);

  const sections: BriefingSection[] = (
    [
      { key: 'india', title: 'India', cats: ['india', 'politics'], n: 4 },
      { key: 'world', title: 'World & Geopolitics', cats: ['world'], n: 4 },
      { key: 'economy', title: 'Economy', cats: ['economy'], n: 3 },
      { key: 'science', title: 'Science & AI', cats: ['science', 'ai'], n: 3 },
      { key: 'ap', title: 'Andhra Pradesh', cats: ['ap', 'vizag'], n: 3 },
      { key: 'government', title: 'Government', cats: ['government'], n: 3 },
      { key: 'exam', title: 'Exam Focus', cats: ['jobs', 'upsc'], n: 3 },
    ] as const
  )
    .map((s) => ({ key: s.key, title: s.title, articleIds: byCategory([...s.cats], s.n).map((a) => a.id) }))
    .filter((s) => s.articleIds.length > 0);

  const headlines = arts.slice(0, 6).map((a) => a.title);
  const remember = arts.slice(0, 5).map((a) => {
    const fact = a.key_facts[0];
    const clean = a.title.replace(/^Sample briefing — /, '');
    return fact ? `${clean} — ${fact}` : clean;
  });

  const briefing: DailyBriefing = {
    date: istDateKey(),
    run_id: runId,
    generated_at: new Date().toISOString(),
    headlines,
    remember,
    sections,
  };
  saveBriefing(briefing);
}

export { getBriefing };
