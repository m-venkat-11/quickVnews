/**
 * Curated static-concept engine — PRISM's signature feature.
 * Maps live news to the static syllabus concepts examiners expect you to link,
 * with GS-paper mapping and a prelims fact when one genuinely exists.
 * Rule-driven (transparent, explainable) rather than generative, so nothing is fabricated.
 */

export interface ConceptMatch {
  gsPaper: string | null;
  prelims: boolean;
  staticConcepts: string[];
  keywords: string[];
  examRelevance: string | null;
  upscAngle: string | null;
}

interface Rule {
  id: string;
  match: RegExp;
  gsPaper: string | null;
  prelims: boolean;
  concepts: string[];
  relevance: string;
  angle?: string;
  prelimsFact?: string;
}

/** Ordered by specificity — first strong match wins, later rules can add tags. */
const RULES: Rule[] = [
  {
    id: 'rbi-monetary',
    match: /\b(rbi|reserve bank|repo rate|monetary policy|policy rate|inflation|cpi|wpi)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Monetary Policy Committee', 'Repo Rate & Reverse Repo', 'CPI vs WPI inflation', 'Inflation targeting (4% ±2%)'],
    relevance: 'UPSC GS-III (Economy) — monetary policy and inflation management.',
    angle: 'Link the rate decision to growth–inflation trade-off and MPC voting pattern.',
    prelimsFact: 'The MPC has six members, including the RBI Governor; it meets bi-monthly.',
  },
  {
    id: 'india-china',
    match: /\b(india[- ]china|lac|line of actual control|mcmahon|galwan|doklam|arunachal)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Line of Actual Control (LAC)', 'McMahon Line', 'India–China relations', 'Panchsheel Principles'],
    relevance: 'UPSC GS-II (International Relations) + Prelims (border geography).',
    angle: 'Connect border developments to trade imbalance and the 1962 war background.',
    prelimsFact: 'The McMahon Line dates to the 1914 Simla Convention.',
  },
  {
    id: 'india-pakistan',
    match: /\b(india[- ]pakistan| LoC\b|pakistan[- ]occupied|cross[- ]border)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['India–Pakistan relations', 'Line of Control (LoC)', 'Simla Agreement', 'Indus Waters Treaty'],
    relevance: 'UPSC GS-II (IR) — neighbourhood policy and security.',
  },
  {
    id: 'geopolitics-general',
    match: /\b(nato|ukraine|russia|middle east|gaza|israel|iran|taiwan|indo[- ]pacific|quad|brics|SCO|g20|un security council)\b/i,
    gsPaper: 'GS-II',
    prelims: false,
    concepts: ['India’s balanced multi-alignment', 'Regional groupings', 'Energy security', 'Diaspora & strategic autonomy'],
    relevance: 'UPSC GS-II (International Relations) — effect on India’s strategic environment.',
  },
  {
    id: 'parliament',
    match: /\b(parliament|lok sabha|rajya sabha|bill passed|ordinance|cabinet approved|union cabinet)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Legislative procedure', 'Money Bill vs Financial Bill', 'Ordinance-making power (Art. 123)', 'Parliamentary committees'],
    relevance: 'UPSC GS-II (Polity) — law-making process and executive–legislature relations.',
    prelimsFact: 'Ordinances lapse six weeks after Parliament reassembles.',
  },
  {
    id: 'supreme-court',
    match: /\b(supreme court|constitution bench|high court|judgment|verdict|petition|cji)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Judicial review', 'Basic Structure doctrine', 'Article 32 / 226', 'Separation of powers'],
    relevance: 'UPSC GS-II (Polity) — judiciary and constitutional interpretation.',
    angle: 'Note whether the ruling expands or narrows fundamental rights.',
  },
  {
    id: 'constitutional',
    match: /\b(articl(e|es)?\s+\d+|constitutional amendment|constitution)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Constitutional amendment procedure (Art. 368)', 'Fundamental Rights vs DPSP'],
    relevance: 'UPSC GS-II (Polity) — constitutional developments.',
  },
  {
    id: 'schemes',
    match: /\b(scheme|yojana|mission|abhiyan|beneficiar(y|ies)|welfare)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Government schemes & delivery', 'Directive Principles (welfare state)', 'Cooperative federalism'],
    relevance: 'UPSC GS-II (Governance) — scheme design, targeting and last-mile delivery.',
  },
  {
    id: 'economy-macro',
    match: /\b(gdp|fiscal deficit|budget|taxation|gst|direct tax|indirect tax|exports?|imports?|trade deficit)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Fiscal policy', 'GST structure & Council', 'Balance of payments', 'Government budgeting'],
    relevance: 'UPSC GS-III (Economy) — growth, fiscal health and trade.',
  },
  {
    id: 'banking',
    match: /\b(bank|npa|banking|insolvency|ibc)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Banking sector reforms', 'NPA resolution (IBC 2016)', 'Financial inclusion (Jan Dhan)'],
    relevance: 'UPSC GS-III (Economy) — banking and credit.',
  },
  {
    id: 'defence',
    match: /\b(defence|defense|army|navy|air force|missile|drdo|hal|exercise|brahmos|agni|ins\b|ins\b)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Defence indigenisation (Atmanirbhar Bharat)', 'DRDO programmes', 'Military exercises', 'Defence exports'],
    relevance: 'UPSC GS-III (Security) — capability building and strategic autonomy.',
    prelimsFact: 'DRDO operates under the Ministry of Defence, founded 1958.',
  },
  {
    id: 'space',
    match: /\b(isro|nasa|esa|space|satellite|launch vehicle|chandrayaan|gaganyaan|lunar|mars mission)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Indian space programme', 'ISRO launch vehicles (PSLV/GSLV/LVM3)', 'Space policy & privatisation (IN-SPACe)'],
    relevance: 'UPSC GS-III (Science & Tech) — space capability and commercialisation.',
    angle: 'Connect the mission to applications: navigation, telemedicine, disaster warning.',
    prelimsFact: 'ISRO was founded in 1969; Vikram Sarabhai is its founding father.',
  },
  {
    id: 'climate',
    match: /\b(climate|cop\d*|emissions|renewable|solar|carbon|net zero|global warming|biodiversity|pollution|heatwave|monsoon|el ni[nñ]o)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Climate change & India’s NDCs', 'International Solar Alliance', 'Panchamrit pledge (COP26)', 'Disaster management cycle'],
    relevance: 'UPSC GS-III (Environment) + GS-I (geography of climate phenomena).',
    angle: 'For monsoon/El Niño stories, link to agriculture and inflation pass-through.',
  },
  {
    id: 'environment-nature',
    match: /\b(wildlife|tiger|elephant|forest|national park|sanctuary|wetland|ramsar|species)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Conservation regimes (WPA 1972)', 'Protected area network', 'Ramsar wetlands'],
    relevance: 'UPSC Prelims-heavy — species, parks and conventions.',
  },
  {
    id: 'science-tech',
    match: /\b(quantum|semiconductor|chip|ai\b|artificial intelligence|genome|biotech|vaccine|clinical trial|robot)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Emerging technologies & governance', 'India Semiconductor Mission', 'National Quantum Mission', 'AI ethics'],
    relevance: 'UPSC GS-III (Science & Tech) — technology capability and regulation.',
  },
  {
    id: 'ai-governance',
    match: /\b(ai regulation|ai safety|ai act|gpu|compute|foundation model|large language model)\b/i,
    gsPaper: 'GS-III',
    prelims: false,
    concepts: ['AI governance frameworks', 'Digital India Act (proposed)', 'Compute infrastructure policy'],
    relevance: 'UPSC GS-III (S&T) + GS-II (regulation) — AI policy landscape.',
  },
  {
    id: 'ap-state',
    match: /\b(andhra pradesh|amaravati|visakhapatnam|polavaram|appsc|vijayawada|tirupati|godavari|krishna basin)\b/i,
    gsPaper: 'APPSC',
    prelims: true,
    concepts: ['AP state reorganisation (2014)', 'Polavaram project (national status)', 'State legislative process', 'AP economy & ports policy'],
    relevance: 'APPSC Group-I/II — state schemes, geography and economy.',
    angle: 'For Vizag stories, link to the port-led development model.',
    prelimsFact: 'Andhra Pradesh was formed on 1 November 1956 (States Reorganisation).',
  },
  {
    id: 'elections',
    match: /\b(election commission|elections|poll|assembly election|loksabha election|vote)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Election Commission of India (Art. 324)', 'Model Code of Conduct', 'Representation of the People Act 1950/51'],
    relevance: 'UPSC GS-II (Polity) — electoral machinery.',
  },
  {
    id: 'health',
    match: /\b(health|disease|vaccination|who|outbreak|hospital|ayushman)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['Public health infrastructure', 'Ayushman Bharat', 'Communicable disease control'],
    relevance: 'UPSC GS-II (Governance) — health policy.',
  },
  {
    id: 'education',
    match: /\b(education|university|neet|jee|ugc|school|literacy|nep\b)\b/i,
    gsPaper: 'GS-II',
    prelims: true,
    concepts: ['National Education Policy 2020', 'RTE Act', 'Higher-education regulators'],
    relevance: 'UPSC GS-II (Governance) — education policy.',
  },
  {
    id: 'jobs-recruitment',
    match: /\b(recruitment|notification|vacanc(y|ies)|upsc cse|appsc group|ssc cgl|ibps|rrb)\b/i,
    gsPaper: null,
    prelims: false,
    concepts: ['Constitutional bodies: UPSC (Art. 315–323)', 'State PSCs'],
    relevance: 'Exam logistics — know the constitutional basis of PSCs for GS-II.',
    prelimsFact: 'UPSC is a constitutional body under Articles 315–323.',
  },
  {
    id: 'energy',
    match: /\b(energy|power grid|coal|nuclear|hydro|thermal|electricity|discom)\b/i,
    gsPaper: 'GS-III',
    prelims: true,
    concepts: ['Energy security', 'Power sector reforms', 'Nuclear liability & expansion'],
    relevance: 'UPSC GS-III (Economy/Environment) — energy transition.',
  },
];

const STATE_TAGS = [
  { state: 'Andhra Pradesh', re: /\b(andhra pradesh|ap assembly|amaravati|visakhapatnam|polavaram|appsc)\b/i },
];

export function matchConcepts(text: string): ConceptMatch {
  const concepts = new Set<string>();
  const keywords = new Set<string>();
  let gsPaper: string | null = null;
  let prelims = false;
  const relevance: string[] = [];
  const angles: string[] = [];

  for (const rule of RULES) {
    if (rule.match.test(text)) {
      rule.concepts.forEach((c) => concepts.add(c));
      keywords.add(rule.id);
      if (!gsPaper && rule.gsPaper) gsPaper = rule.gsPaper;
      if (rule.prelims) prelims = true;
      relevance.push(rule.relevance);
      if (rule.angle) angles.push(rule.angle);
    }
  }

  if (STATE_TAGS.some((s) => s.re.test(text))) {
    keywords.add('andhra-pradesh');
  }

  return {
    gsPaper,
    prelims,
    staticConcepts: [...concepts].slice(0, 6),
    keywords: [...keywords],
    examRelevance: relevance.length ? [...new Set(relevance)].slice(0, 2).join(' ') : null,
    upscAngle: angles.length ? angles[0] : null,
  };
}

/** Best prelims fact from matched rules (only when a rule carries one). */
export function prelimsFactFor(text: string): string | null {
  for (const rule of RULES) {
    if (rule.prelimsFact && rule.match.test(text)) return rule.prelimsFact;
  }
  return null;
}
