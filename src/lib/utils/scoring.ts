import { CATEGORY_BY_SLUG, SCORING } from '@/lib/config';
import type { Priority } from '@/lib/types';

export interface ScoreInput {
  category: string;
  publishedAt: Date;
  sourceTier: number; // 1 official … 3 general
  examRelevant: boolean; // GS/prelims mapping found
  breadth: number; // distinct signals: countries/entities/keywords matched
  isGovtOrOfficial?: boolean;
}

/**
 * Composite importance 0–100. Deliberately NOT popularity-based:
 * category weight + recency + source quality + exam relevance + breadth of impact.
 */
export function scoreImportance(input: ScoreInput): number {
  const cat = CATEGORY_BY_SLUG[input.category];
  const catScore = cat ? cat.weight : 3; // 0–6 → scale below
  const catNorm = (catScore / 6) * 100;

  const ageHours = Math.max(0, (Date.now() - input.publishedAt.getTime()) / 3_600_000);
  const recency = Math.max(0, 100 - (ageHours / 24) * 60); // fresh=100, 24h→40, 48h→<10

  const srcNorm = input.sourceTier === 1 ? 100 : input.sourceTier === 2 ? 78 : 55;
  const officialBonus = input.isGovtOrOfficial ? 8 : 0;

  const exam = input.examRelevant ? 100 : 35;
  const breadth = Math.min(100, input.breadth * 18);

  const score =
    catNorm * SCORING.categoryWeight +
    recency * SCORING.recencyWeight +
    (srcNorm + officialBonus) * SCORING.sourceWeight +
    exam * SCORING.examWeight +
    breadth * SCORING.breadthWeight;

  return Math.round(Math.max(0, Math.min(100, score)));
}

export function priorityFor(score: number): Priority {
  if (score >= SCORING.thresholds.critical) return 'CRITICAL';
  if (score >= SCORING.thresholds.high) return 'HIGH';
  if (score >= SCORING.thresholds.medium) return 'MEDIUM';
  return 'LOW';
}

/** UPSC relevance 0–100: how much exam signal the story carries. */
export function upscRelevance(args: {
  gsPaper: string | null;
  prelims: boolean;
  category: string;
  staticConcepts: number;
}): number {
  let s = 0;
  if (args.gsPaper) s += 34;
  if (args.prelims) s += 22;
  s += Math.min(24, args.staticConcepts * 8);
  const catBoost: Record<string, number> = {
    india: 14, economy: 14, defence: 12, environment: 12, government: 12,
    world: 10, science: 10, politics: 10, ap: 8, jobs: 4, ai: 6, vizag: 4,
  };
  s += catBoost[args.category] ?? 6;
  return Math.max(5, Math.min(100, s));
}
