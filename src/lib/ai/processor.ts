import type { Article, Priority } from '@/lib/types';
import { truncate } from '@/lib/utils/text';
import { matchConcepts, prelimsFactFor } from './concepts';
import { developingFlags, routeCategory, detectCountries, regionFor, confidenceFor } from './classify';
import { scoreImportance, priorityFor } from '@/lib/utils/scoring';
import { chat, parseJsonReply, aiEnabled } from './provider';

/** Raw item as delivered by a NewsProvider before processing. */
export interface RawItem {
  title: string;
  url: string;
  sourceName: string;
  sourceTier: number;
  description?: string | null;
  publishedAt: Date;
  isDemo?: boolean;
  /** Section the provider placed the item in (RSS feed section, demo template). */
  declaredCategory?: string;
}

export interface ProcessedItem {
  title: string;
  quick_summary: string;
  summary: string;
  deep_summary: string;
  simple_explanation: string;
  what_happened: string;
  background: string;
  why_it_matters: string;
  india_angle: string;
  key_facts: string[];
  category: string;
  subcategory: string | null;
  keywords: string[];
  entities: string[];
  countries: string[];
  region: string;
  gs_paper: string | null;
  prelims_fact: string | null;
  upsc_angle: string | null;
  static_concepts: string[];
  exam_relevance: string | null;
  importance: number;
  priority: Priority;
  confidence: Article['confidence'];
  ai_processed: 0 | 1;
}

const LLM_SYSTEM = `You are the editorial engine of PRISM CURRENT, an exam-focused current-affairs intelligence service for Indian competitive exams (UPSC, APPSC, SSC, Banking).
Return STRICT JSON with keys: quick_summary (max 35 words), summary (3-4 sentences), deep_summary (5-7 sentences with background and implications), simple_explanation (1-2 very simple sentences a beginner understands), why_it_matters (2-3 sentences), india_angle (India-specific significance, 1-2 sentences; if none, say "No direct India angle."), key_facts (array of 2-4 short bullet facts with concrete data when present in the text).
Rules: Never invent facts, quotes or statistics. Use only information in the provided text. Maintain strict political neutrality — attribute claims ("the government said", "opposition leaders argued").`;

function fallbackBackground(text: string, cat: string): string {
  const map: Record<string, string> = {
    economy: 'This sits within India’s ongoing monetary and fiscal policy context, where growth, inflation and employment are tracked closely by the RBI and the Finance Ministry.',
    defence: 'This occurs within India’s broader national-security posture, including border management, indigenisation of equipment and regional military balance.',
    world: 'This development fits the current phase of shifting global alignments, where India balances strategic autonomy with deepening partnerships.',
    ai: 'This is part of the fast-moving global AI race, where model capability, compute access and regulation are shaping economic and strategic advantage.',
    science: 'This builds on India’s growing S&T capability and the global push in frontier research areas.',
    environment: 'This relates to India’s climate commitments (NDCs) and its vulnerability to extreme weather.',
    india: 'This belongs to the continuing policy agenda of the central government and constitutional institutions.',
    politics: 'This unfolds within the regular legislative and political cycle at the centre.',
    government: 'This is part of the government’s welfare-delivery and administrative-reform agenda.',
    ap: 'This fits Andhra Pradesh’s post-2024 policy push on infrastructure, investment and welfare.',
    vizag: 'This relates to Visakhapatnam’s growth as a port-industrial-IT hub of Andhra Pradesh.',
    jobs: 'Recruitment calendars matter to lakhs of aspirants; official notifications are the only reliable source.',
  };
  return map[cat] ?? map.india;
}

function extractiveSummary(desc: string | null | undefined, title: string): string {
  const d = (desc ?? '').trim();
  // Substantive description: don't echo the headline after it.
  if (d.length >= 80) return truncate(d, 240);
  const text = [d, title].filter(Boolean).join(' ').trim();
  if (!text) return title;
  return truncate(text, 240);
}

export async function processItem(raw: RawItem): Promise<ProcessedItem> {
  const cleanTitle = raw.title.replace(/^sample briefing\s*[—-]\s*/i, '');
  const textBlob = [cleanTitle, raw.description].filter(Boolean).join('. ');
  const concept = matchConcepts(textBlob);
  const countries = detectCountries(textBlob);
  const region = regionFor(textBlob, countries, '');
  const flags = developingFlags(textBlob);

  // Category: declared section respected, then rule routing, then concept hints.
  const category = routeCategory(
    textBlob,
    concept.keywords.includes('jobs-recruitment') ? 'jobs' : 'india',
    raw.declaredCategory
  );
  const isGovt =
    raw.sourceTier === 1 ||
    /\b(pib|press information bureau|ministry|rbi|supreme court|election commission|isro|drdo|gazette)\b/i.test(
      raw.sourceName
    );

  // ---- Optional LLM enrichment -------------------------------------------
  let quick = '';
  let summary = '';
  let deep = '';
  let simple = '';
  let why = '';
  let india = '';
  let keyFacts: string[] = [];

  if (aiEnabled()) {
    const reply = await chat({
      system: LLM_SYSTEM,
      user: `TITLE: ${raw.title}\nSOURCE: ${raw.sourceName}\nPUBLISHED: ${raw.publishedAt.toISOString()}\nTEXT: ${truncate(raw.description ?? '', 1500)}`,
      maxTokens: 700,
    });
    const json = parseJsonReply(reply);
    if (json) {
      quick = String(json.quick_summary ?? '').trim();
      summary = String(json.summary ?? '').trim();
      deep = String(json.deep_summary ?? '').trim();
      simple = String(json.simple_explanation ?? '').trim();
      why = String(json.why_it_matters ?? '').trim();
      india = String(json.india_angle ?? '').trim();
      keyFacts = Array.isArray(json.key_facts) ? (json.key_facts as string[]).map(String).slice(0, 4) : [];
    }
  }

  if (!summary) {
    summary = extractiveSummary(raw.description, cleanTitle);
    quick = quick || truncate(summary.split(/(?<=[.!?])\s/)[0] ?? summary, 120);
    deep = deep || `${summary} ${fallbackBackground(textBlob, category)}`.trim();
    simple = simple || firstSentencePlain(summary);
    why = why || fallbackWhy(textBlob, category, concept);
    india = india || fallbackIndiaAngle(textBlob, category, countries);
    // Facts come description-first so they add information beyond the headline.
    keyFacts = keyFacts.length ? keyFacts : extractFacts([raw.description, cleanTitle].filter(Boolean).join('. '));
  }

  const importance = scoreImportance({
    category,
    publishedAt: raw.publishedAt,
    sourceTier: raw.sourceTier,
    examRelevant: Boolean(concept.gsPaper) || concept.prelims,
    breadth: countries.length + Math.min(3, concept.staticConcepts.length),
    isGovtOrOfficial: isGovt,
  });

  return {
    // Store the clean title — demo items carry a visible SAMPLE badge in the UI
    // instead of the redundant text prefix.
    title: cleanTitle.trim(),
    quick_summary: quick,
    summary,
    deep_summary: deep,
    simple_explanation: simple,
    what_happened: summary,
    background: fallbackBackground(textBlob, category),
    why_it_matters: why,
    india_angle: india,
    key_facts: keyFacts.slice(0, 4),
    category,
    subcategory: concept.staticConcepts[0] ?? null,
    keywords: [...new Set([...concept.keywords, ...textKeywords(textBlob)])].slice(0, 10),
    entities: entitiesOf(textBlob),
    countries,
    region,
    gs_paper: concept.gsPaper,
    prelims_fact: concept.prelims ? prelimsFactFor(textBlob) : null,
    upsc_angle: concept.upscAngle,
    static_concepts: concept.staticConcepts,
    exam_relevance: concept.examRelevance,
    importance,
    priority: priorityFor(importance),
    confidence: confidenceFor({
      sourceTier: raw.sourceTier,
      sourceCount: 1,
      developingKeywords: flags.developing,
      conflictKeywords: flags.conflict,
    }),
    ai_processed: aiEnabled() ? 1 : 0,
  };
}

function firstSentencePlain(s: string): string {
  const first = s.split(/(?<=[.!?])\s/)[0] ?? s;
  return truncate(first, 160);
}

function fallbackWhy(text: string, cat: string, concept: ReturnType<typeof matchConcepts>): string {
  const bits: string[] = [];
  if (concept.gsPaper) bits.push(`Directly relevant for ${concept.gsPaper}; the underlying concepts recur in the exam.`);
  if (concept.prelims) bits.push('Carries concrete factual detail with prelims potential.');
  const catBits: Record<string, string> = {
    economy: 'Interest-rate, price and jobs signals affect household budgets and the investment climate.',
    defence: 'Changes India’s security posture or capability — standard GS-III territory.',
    world: 'Shifts the strategic environment India operates in; expect follow-on diplomatic moves.',
    ai: 'AI capability and rules are becoming strategic and economic infrastructure.',
    science: 'Expands the frontier of what India can do in space, health or advanced technology.',
    environment: 'Environment outcomes feed into agriculture, health and disaster preparedness.',
    india: 'Central decisions and court rulings change how the country is governed day to day.',
    politics: 'Legislative and political developments shape policy direction for the coming years.',
    government: 'Scheme design and delivery affect millions of intended beneficiaries.',
    ap: 'State decisions shape jobs, infrastructure and welfare in Andhra Pradesh.',
    vizag: 'Infrastructure and investment decisions directly shape Visakhapatnam’s economy and jobs.',
    jobs: 'Missing a notification window costs an attempt — deadlines are hard.',
  };
  const extra = catBits[cat];
  if (extra) bits.push(extra);
  return bits.slice(0, 2).join(' ') || 'Significant development worth tracking for its policy and exam implications.';
}

function fallbackIndiaAngle(text: string, cat: string, countries: string[]): string {
  if (countries.includes('India')) return 'India is a principal actor here; track official Indian responses and follow-up policy steps.';
  if (cat === 'world') return 'Watch India’s official position — strategic autonomy and balanced partnerships guide its response.';
  if (cat === 'ai') return 'For India: compute access, AI talent and regulation under the IndiaAI Mission are the angles to track.';
  if (cat === 'vizag' || cat === 'ap') return 'Relevant for APPSC: state policy, jobs and infrastructure are core state-exam themes.';
  return 'India-relevant through trade, technology, security or policy spillovers.';
}

/** Very small NER pass for entity chips on cards. */
function entitiesOf(text: string): string[] {
  const ents: string[] = [];
  const patterns: [RegExp, string][] = [
    [/\bRBI\b|\bReserve Bank of India\b/, 'RBI'],
    [/\bSEBI\b/, 'SEBI'],
    [/\bISRO\b/, 'ISRO'],
    [/\bDRDO\b/, 'DRDO'],
    [/\bSupreme Court\b/, 'Supreme Court'],
    [/\bElection Commission\b/, 'ECI'],
    [/\bParliament\b/, 'Parliament'],
    [/\bNITI Aayog\b/, 'NITI Aayog'],
    [/\bIMF\b/, 'IMF'],
    [/\bWorld Bank\b/, 'World Bank'],
    [/\bNATO\b/, 'NATO'],
    [/\bUnited Nations\b|\bUN\b/, 'UN'],
    [/\bUPSC\b/, 'UPSC'],
    [/\bAPPSC\b/, 'APPSC'],
  ];
  for (const [re, name] of patterns) if (re.test(text)) ents.push(name);
  return [...new Set(ents)].slice(0, 6);
}

function textKeywords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
  const stop = new Set(['this', 'that', 'with', 'from', 'have', 'will', 'been', 'said', 'more', 'after', 'over', 'about']);
  const freq = new Map<string, number>();
  for (const w of words) if (!stop.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w);
}

/** Pulls concrete, quotable facts (percentages, dates, amounts) when present. */
function extractFacts(text: string): string[] {
  const facts: string[] = [];
  const percent = text.match(/[^.!?]*\b\d+(\.\d+)?\s*(%|per cent|percent)[^.!?]*[.!?]?/g);
  if (percent) facts.push(...percent.slice(0, 2).map((s) => truncate(s.trim(), 140)));
  const money = text.match(/[^.!?]*\b(₹|rs\.?|usd\s*\$?\s*\d|\$\s?\d|\bbillion|\bcrore|\blakh)[^.!?]*[.!?]?/gi);
  if (money) facts.push(...money.slice(0, 2).map((s) => truncate(s.trim(), 140)));
  if (!facts.length) {
    const first = text.split(/(?<=[.!?])\s/).find((s) => s.length > 40);
    if (first) facts.push(truncate(first.trim(), 140));
  }
  return facts.slice(0, 3);
}
