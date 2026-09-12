import type { Confidence } from '@/lib/types';

/** Country detection for the geopolitical map + "countries" field. */
const COUNTRY_PATTERNS: [string, RegExp][] = [
  ['India', /\bindia|indian\b/i],
  ['United States', /\b(u\.?s\.?|united states|america|washington|white house)\b/i],
  ['China', /\b(china|chinese|beijing)\b/i],
  ['Russia', /\b(russia|russian|moscow|kremlin)\b/i],
  ['Ukraine', /\bukraine\b/i],
  ['Israel', /\bisrael\b/i],
  ['Palestine', /\bpalestin(e|ian)s?\b/i],
  ['Iran', /\biran\b/i],
  ['United Kingdom', /\b(britain|uk\b|united kingdom|london)\b/i],
  ['France', /\bfrance|paris\b/i],
  ['Germany', /\bgermany|berlin\b/i],
  ['Japan', /\bjapan\b/i],
  ['Australia', /\baustralia\b/i],
  ['Pakistan', /\bpakistan\b/i],
  ['Bangladesh', /\bbangladesh\b/i],
  ['Nepal', /\bnepal\b/i],
  ['Sri Lanka', /\bsri lanka\b/i],
  ['United Arab Emirates', /\b(uae|abu dhabi|dubai)\b/i],
  ['Saudi Arabia', /\bsaudi\b/i],
  ['Brazil', /\bbrazil\b/i],
  ['South Africa', /\bsouth africa\b/i],
  ['Indonesia', /\bindonesia\b/i],
  ['Singapore', /\bsingapore\b/i],
  ['Vietnam', /\bvietnam\b/i],
  ['Canada', /\bcanada\b/i],
];

export function detectCountries(text: string): string[] {
  const out: string[] = [];
  for (const [name, re] of COUNTRY_PATTERNS) if (re.test(text)) out.push(name);
  return out.slice(0, 4);
}

export function regionFor(text: string, countries: string[], category: string): string {
  if (/\b(andhra pradesh|amaravati|visakhapatnam|vijayawada|tirupati)\b/i.test(text)) return 'Andhra Pradesh';
  if (/\b(visakhapatnam|vizag)\b/i.test(text)) return 'Visakhapatnam';
  if (category === 'vizag') return 'Visakhapatnam';
  if (category === 'ap') return 'Andhra Pradesh';
  if (countries.includes('India') && countries.length === 1) return 'India';
  if (countries.length >= 2) return 'Global';
  const re = /\b(south asia|indo-?pacific|middle east|europe|africa|asean|americas|east asia|central asia)\b/i;
  const m = text.match(re);
  return m ? m[1].replace(/\b\w/g, (c) => c.toUpperCase()) : countries[0] ?? 'India';
}

/**
 * Category routing — order matters; first hit wins, with overrides below.
 * NOTE: a `world` rule must exist BEFORE the `india` catch-all, otherwise every
 * international story containing the word "India" gets misrouted as national.
 */
const CATEGORY_RULES: [string, RegExp][] = [
  ['vizag', /\bvisakhapatnam|\bvizag\b/i],
  ['ap', /\b(andhra pradesh|amaravati|appsc|polavaram|vijayawada|tirupati|ap assembly|ap government)\b/i],
  ['jobs', /\b(upsc|appsc|ssc|ibps|sbi po|rrb|nta|recruitment|notification|vacanc(y|ies)|apply online|exam date)\b/i],
  ['ai', /\b(artificial intelligence|\bai\b|openai|anthropic|chatgpt|llm|gpu|semiconductor|chip foundry|nvidia|deepmind|model release)\b/i],
  ['defence', /\b(defence|defense|army|navy|air force|missile|drdo|brahmos|military exercise|border troops)\b/i],
  ['economy', /\b(rbi|repo rate|inflation|gdp|fiscal|gst|budget|trade deficit|exports|imports|stock market|sensex|nifty|banking)\b/i],
  ['science', /\b(isro|nasa|space|satellite|quantum|genome|physics|astronomy|telescope|research breakthrough|vaccine trial)\b/i],
  ['environment', /\b(climate|cop\d|emissions|biodiversity|wildlife|pollution|renewable|solar|heatwave|monsoon|flood|cyclone)\b/i],
  ['government', /\b(scheme|yojana|abhiyan|portal launched|cabinet|government approves|ministry of)\b/i],
  ['politics', /\b(parliament|lok sabha|rajya sabha|bill passed|ordinance|election commission|chief minister announces|opposition|alliance)\b/i],
  ['world', /\b(g20|united nations|\bun\b|nato|eu\b|european union|geopolitic|treaty|bilateral|summit|diplomat|sanctions|strait|indo-?pacific|middle east|ukraine|russia|china|israel|palestine|iran|asean|saarc|foreign minister|heads of state)\b/i],
  ['india', /\b(india|indian|new delhi|supreme court|high court|centre)\b/i],
];

export function routeCategory(text: string, fallback = 'india', declared?: string): string {
  // Providers (RSS sections, demo templates) declare a section; the classifier
  // only overrides it when the text clearly belongs elsewhere.
  if (declared && declared !== 'india') {
    const re = CATEGORY_RULES.find(([slug]) => slug === declared)?.[1];
    if (re && !re.test(text)) {
      // Declared category still plausible (no contradicting stronger rule) — keep it,
      // unless a high-specificity rule (vizag/ap/jobs) matches the text.
      const strongOverride = CATEGORY_RULES.slice(0, 3).find(([, sre]) => sre.test(text));
      if (!strongOverride) return declared;
    }
  }
  for (const [slug, re] of CATEGORY_RULES) if (re.test(text)) return slug;
  return fallback;
}

export interface ConfidenceInput {
  sourceTier: number; // 1 official
  sourceCount: number;
  developingKeywords: boolean; // "reports say", "unconfirmed"…
  conflictKeywords: boolean; // "however", "contradict"…
}

/** Confidence label — deliberately conservative; never shows a fake "100% verified". */
export function confidenceFor(input: ConfidenceInput): Confidence {
  if (input.developingKeywords) return 'developing';
  if (input.conflictKeywords) return 'reports-differ';
  if (input.sourceTier === 1) return 'official';
  if (input.sourceCount >= 2) return 'multi-source';
  return 'source-verified';
}

const DEVELOPING_RE = /\b(reports (say|suggest)|unconfirmed|still unclear|developing story|emerging reports)\b/i;
const CONFLICT_RE = /\b(however|on the contrary|contradict(ing|ed)?|dispute[sd]?|denied|sources differ)\b/i;

export function developingFlags(text: string): { developing: boolean; conflict: boolean } {
  return { developing: DEVELOPING_RE.test(text), conflict: CONFLICT_RE.test(text) };
}
