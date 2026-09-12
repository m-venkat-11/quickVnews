/**
 * Demo content — realistic sample intelligence cards so the interface is never empty.
 * Every demo item is marked is_demo=1 in the DB and rendered with a visible
 * "SAMPLE" badge in the UI. Headlines explicitly reference the sample nature.
 */
import type { RawItem } from '@/lib/ai/processor';

interface DemoTemplate {
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  sourceTier: number;
  category: string;
}

/** ~34 templates across categories; ingest picks 12 per cycle, cycling deterministically. */
export const DEMO_TEMPLATES: DemoTemplate[] = [
  { title: 'Sample briefing — RBI holds repo rate steady as inflation eases within tolerance band', description: 'The Monetary Policy Committee voted 5:1 to keep the policy repo rate unchanged, noting that headline CPI inflation has moderated while growth momentum remains resilient. Governor flagged food-price volatility as the key risk to the disinflation path.', sourceName: 'RBI (sample)', sourceUrl: 'https://www.rbi.org.in', sourceTier: 1, category: 'economy' },
  { title: 'Sample briefing — Union Cabinet approves new semiconductor manufacturing incentive cluster', description: 'The Cabinet approved incentives for setting up a fabrication and two assembly-test units, with an outlay covering capital support and design-linked incentives. Officials said the move targets domestic chip capability and supply-chain resilience.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'government' },
  { title: 'Sample briefing — ISRO completes key propulsion test for next lunar mission', description: 'ISRO confirmed a successful long-duration firing of the stage engine planned for the upcoming lunar mission, clearing a critical milestone toward the launch window announced for next year.', sourceName: 'ISRO (sample)', sourceUrl: 'https://www.isro.gov.in', sourceTier: 1, category: 'science' },
  { title: 'Sample briefing — India and Australia expand critical-minerals partnership under ERIA framework', description: 'Both sides agreed to co-develop critical-mineral supply chains and joint exploration projects, building on the Economic Cooperation and Trade Agreement. The deal covers lithium, rare earths and processing technology exchange.', sourceName: 'The Hindu (sample)', sourceUrl: 'https://www.thehindu.com', sourceTier: 2, category: 'world' },
  { title: 'Sample briefing — Andhra Pradesh cabinet clears new port-led industrial corridor near Visakhapatnam', description: 'The state cabinet approved land allocation and initial funding for a port-linked industrial corridor, with planned anchor units in petrochemicals, green ammonia and electronics manufacturing, and a skills-training component for local youth.', sourceName: 'AP Government (sample)', sourceUrl: 'https://ap.gov.in', sourceTier: 1, category: 'ap' },
  { title: 'Sample briefing — Visakhapatnam airport expansion phase clears environmental appraisal', description: 'The expansion plan — a second terminal and extended runway — moved forward after the appraisal panel sought no further clarifications. Officials project higher daily flight movements and new cargo capacity once works begin.', sourceName: 'Andhra Jyothy (sample)', sourceUrl: 'https://www.andhrajyothy.com', sourceTier: 3, category: 'vizag' },
  { title: 'Sample briefing — Leading AI lab releases open-weight model claiming benchmark gains at lower compute cost', description: 'The model family focuses on reasoning tasks with a context window suitable for document analysis, and ships under a license permitting commercial research use. Independent evaluations are pending.', sourceName: 'TechCrunch (sample)', sourceUrl: 'https://techcrunch.com', sourceTier: 3, category: 'ai' },
  { title: 'Sample briefing — Defence Ministry signs contract for indigenous niche-technology naval systems', description: 'The contract covers indigenous design and production of niche naval technologies under the Buy Indian-Indigenously Designed category, with offsets directed to MSME suppliers.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'defence' },
  { title: 'Sample briefing — GST Council rationalises rates across key consumer categories', description: 'The Council adjusted rates across several consumer goods and clarified input-credit rules, aiming to simplify compliance. Analysts expect a neutral-to-positive effect on collections over coming quarters.', sourceName: 'Business Standard (sample)', sourceUrl: 'https://www.business-standard.com', sourceTier: 2, category: 'economy' },
  { title: 'Sample briefing — UPSC announces Civil Services Preliminary Examination schedule with revised centres', description: 'The Commission released the annual calendar confirming notification and exam dates, adding several new test centres and reiterating the single-day prelims format.', sourceName: 'UPSC (sample)', sourceUrl: 'https://upsc.gov.in', sourceTier: 1, category: 'jobs' },
  { title: 'Sample briefing — APPSC opens applications for Group-II services with expanded district quota', description: 'The Commission notified vacancies across services with an expanded district-level allocation, and confirmed computer-based testing for the screening round.', sourceName: 'APPSC (sample)', sourceUrl: 'https://psc.ap.gov.in', sourceTier: 1, category: 'jobs' },
  { title: 'Sample briefing — New Ramsar wetland sites notified, taking India’s tally to a record high', description: 'The additions span multiple states and strengthen protection for migratory-bird habitat under the Ramsar Convention framework, with management plans to be notified separately.', sourceName: 'Down To Earth (sample)', sourceUrl: 'https://www.downtoearth.org.in', sourceTier: 2, category: 'environment' },
  { title: 'Sample briefing — Supreme Court constitution bench begins hearing on electoral-reform petition', description: 'A five-judge bench started hearings on a petition seeking reforms to election-related procedures, with the Centre to file its response in four weeks. The case has been tagged with pending related matters.', sourceName: 'The Hindu (sample)', sourceUrl: 'https://www.thehindu.com', sourceTier: 2, category: 'politics' },
  { title: 'Sample briefing — India hosts first trilateral maritime exercise with two Indo-Pacific partners', description: 'The inaugural trilateral exercise covered interdiction drills, search-and-rescue and domain-awareness data sharing, reflecting deepening coordination in the Indo-Pacific.', sourceName: 'IDRW (sample)', sourceUrl: 'https://idrw.org', sourceTier: 3, category: 'defence' },
  { title: 'Sample briefing — National Quantum Mission selects first cohort of thematic hubs', description: 'Four thematic hubs across computing, communication, sensing and materials were selected, with seed grants to academia-industry consortia for hardware and talent development.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'science' },
  { title: 'Sample briefing — IMD issues first seasonal outlook; above-normal monsoon forecast with regional variation', description: 'The seasonal outlook indicates above-normal rainfall overall, with below-normal probability in parts of the east. Forecast skill and district-level advisories were also discussed.', sourceName: 'The Hindu (sample)', sourceUrl: 'https://www.thehindu.com', sourceTier: 2, category: 'environment' },
  { title: 'Sample briefing — India’s services exports hit record on software and business-services demand', description: 'Services exports reached a monthly record led by software and global-capability-centre demand, partially offsetting goods-trade softness, according to RBI balance-of-payments data.', sourceName: 'Business Standard (sample)', sourceUrl: 'https://www.business-standard.com', sourceTier: 2, category: 'economy' },
  { title: 'Sample briefing — AI regulation: EU implementation timeline and India’s approach compared', description: 'With the EU AI Act entering enforcement phases, analysis notes India’s lighter-touch, sectoral approach and the IndiaAI Mission’s compute and safety-institute plans.', sourceName: 'TechCrunch (sample)', sourceUrl: 'https://techcrunch.com', sourceTier: 3, category: 'ai' },
  { title: 'Sample briefing — Polavaram project diaphragm wall works enter final phase, officials confirm timeline', description: 'The national-status project’s remaining works are in the final phase with a completion timeline reaffirmed; the state reiterated irrigation and power benefits once commissioned.', sourceName: 'AP Government (sample)', sourceUrl: 'https://ap.gov.in', sourceTier: 1, category: 'ap' },
  { title: 'Sample briefing — Visakhapatnam steel plant expansion clears next administrative stage', description: 'The expansion plan moved to the next administrative stage with capacity-addition targets and modernisation funding under review, with employment projections shared.', sourceName: 'Andhra Jyothy (sample)', sourceUrl: 'https://www.andhrajyothy.com', sourceTier: 3, category: 'vizag' },
  { title: 'Sample briefing — G20 working group agrees framework on digital public infrastructure exchange', description: 'A framework for DPI knowledge exchange was agreed, covering payments, identity and data-governance lessons, with India’s stack cited as a reference model.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'world' },
  { title: 'Sample briefing — Parliament passes bill to modernise archaic maritime legislation', description: 'The bill replaces a century-old law, consolidating vessel regulation and aligning penalties with current norms; the government said it improves ease of doing business for shipping.', sourceName: 'The Hindu (sample)', sourceUrl: 'https://www.thehindu.com', sourceTier: 2, category: 'politics' },
  { title: 'Sample briefing — WHO prequalifies Indian-made diagnostic for tropical disease programme', description: 'The prequalification enables procurement by UN agencies, expanding access in endemic regions; the Indian manufacturer completed WHO audits for quality systems.', sourceName: 'The Hindu (sample)', sourceUrl: 'https://www.thehindu.com', sourceTier: 2, category: 'science' },
  { title: 'Sample briefing — RRB announces revised vacancy count for annual recruitment cycle', description: 'The board revised the notified vacancies upward after cadre review, and set fresh application windows with a clarified age-relaxation table.', sourceName: 'RRB (sample)', sourceUrl: 'https://www.rrbcdg.gov.in', sourceTier: 1, category: 'jobs' },
  { title: 'Sample briefing — Cabinet approves ₹24,000-crore scheme for urban transport in million-plus cities', description: 'The scheme funds metro-rail extensions and electric-bus deployment in million-plus cities, with viability-gap funding and PPP components for last-mile connectivity.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'government' },
  { title: 'Sample briefing — Semiconductor design-linked incentive draws record applications from startups', description: 'The design-linked incentive received record applications, signalling depth in India’s chip-design talent pool; selections will focus on automotive and industrial chips.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'ai' },
  { title: 'Sample briefing — India pilots AI-based early-warning system for heat-health alerts in three states', description: 'The pilot integrates forecast data with health-system triggers to issue heat-health warnings, aiming to cut heatwave mortality; evaluation results will guide national rollout.', sourceName: 'Down To Earth (sample)', sourceUrl: 'https://www.downtoearth.org.in', sourceTier: 2, category: 'environment' },
  { title: 'Sample briefing — India-China hold next round of corps-commander talks on boundary issues', description: 'Both sides reviewed the disengagement agenda at remaining friction points and agreed to maintain dialogue; earlier rounds delivered partial disengagement in some sectors.', sourceName: 'The Hindu (sample)', sourceUrl: 'https://www.thehindu.com', sourceTier: 2, category: 'world' },
  { title: 'Sample briefing — India Post launches digital-first services for exam-admit-card and passport support', description: 'New post-office digital counters will help citizens access admit-card printing, passport seva support and e-governance help, extending last-mile digital access.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'government' },
  { title: 'Sample briefing — NITI Aayog releases district-level SDG India Index refresh', description: 'The refreshed index tracks district progress on SDG indicators, showing gains in health and water access with persistent gaps in gender and industry indicators.', sourceName: 'PIB (sample)', sourceUrl: 'https://pib.gov.in', sourceTier: 1, category: 'india' },
  { title: 'Sample briefing — RBI approves new digital-payment feature with enhanced fraud controls', description: 'The approvals enable banks to add real-time fraud analytics on UPI rails, with new liability rules for unauthorised transactions to protect users.', sourceName: 'RBI (sample)', sourceUrl: 'https://www.rbi.org.in', sourceTier: 1, category: 'economy' },
  { title: 'Sample briefing — Visakhapatnam metro detailed project report submitted for approval', description: 'The DPR for the light-metro corridor was submitted, covering alignment, stations and financing structure; the state will seek central approval next.', sourceName: 'Andhra Jyothy (sample)', sourceUrl: 'https://www.andhrajyothy.com', sourceTier: 3, category: 'vizag' },
  { title: 'Sample briefing — India adds record renewable capacity in a quarter, led by solar parks', description: 'Quarterly renewable additions set a record with large solar parks and rooftop growth, moving the 500 GW non-fossil target within sight for 2030.', sourceName: 'Down To Earth (sample)', sourceUrl: 'https://www.downtoearth.org.in', sourceTier: 2, category: 'environment' },
];

/**
 * Deterministic, category-interleaved pick so every 6h cycle carries a balanced
 * spread (world/defence/science never starve) while still rotating by cycleIndex.
 */
export function pickDemoCycle(cycleIndex: number, count = 14): DemoTemplate[] {
  const arr = DEMO_TEMPLATES;
  const byCat = new Map<string, DemoTemplate[]>();
  for (const t of arr) {
    const list = byCat.get(t.category) ?? [];
    list.push(t);
    byCat.set(t.category, list);
  }
  const catKeys = [...byCat.keys()].sort();
  // Round-robin across categories, offset by cycle so slots differ.
  const picked: DemoTemplate[] = [];
  let round = 0;
  while (picked.length < Math.min(count, arr.length)) {
    let addedThisRound = false;
    for (const cat of catKeys) {
      const list = byCat.get(cat)!;
      const idx = (cycleIndex + round) % list.length;
      const candidate = list[idx];
      if (candidate && !picked.includes(candidate)) {
        picked.push(candidate);
        if (picked.length >= count) break;
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round++;
  }
  return picked;
}

export function demoRawItems(cycleIndex: number, slotTime: Date): RawItem[] {
  return pickDemoCycle(cycleIndex).map((t, i) => ({
    title: t.title,
    // Unique per-template URL so URL-dedupe doesn't collapse same-source samples.
    url: `${t.sourceUrl}/#sample-${slug(t.title)}`,
    sourceName: t.sourceName,
    sourceTier: t.sourceTier,
    description: t.description,
    publishedAt: new Date(slotTime.getTime() - (i % 6) * 27 * 60_000), // spread within window
    isDemo: true,
    declaredCategory: t.category,
  }));
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}
