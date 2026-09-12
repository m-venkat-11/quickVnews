import { db } from './index';
import { istDateKey } from '@/lib/utils/time';

/** Seeded daily-content pools. `date` stays NULL until the rotation engine assigns it. */
export function seedIfEmpty(): void {
  const d = db();
  const count = (d.prepare('SELECT COUNT(*) AS c FROM facts').get() as { c: number }).c;
  if (count > 0) return;

  const facts: [string, string, string, string | null, string | null][] = [
    ['Polity', 'The Indian Constitution is one of the world’s longest written constitutions.', 'Originally 395 articles in 22 parts with 8 schedules; now over 470 articles across 25 parts and 12 schedules.', 'It blends borrowed features with Indian innovations — a favourite UPSC comparison theme.', 'UPSC Prelims (Polity) — frequently asked on parts, schedules and borrowed features.'],
    ['Polity', 'The Preamble’s words “Socialist”, “Secular” and “Integrity” were added by the 42nd Amendment (1976).', 'The Amendment also strengthened “unity of the nation” into “unity and integrity of the nation”.', 'Shows how the Preamble, though non-justiciable, evolves through the amendment process.', 'UPSC Prelims (Polity) — classic amendment question.'],
    ['Economy', 'Repo rate is the rate at which RBI lends to banks against government securities.', 'It is the operative policy rate under the liquidity-adjustment facility; changes transmit to EMIs within weeks.', 'Anchor concept for every monetary-policy story — GS-III mains + prelims.', 'UPSC GS-III (Economy).'],
    ['History', 'The Dandi March covered about 385 km over 24 days in 1930.', 'Gandhiji walked from Sabarmati Ashram to Dandi, breaking the salt law at the end of the march.', 'Civil Disobedience began with salt — a recurring modern-India theme.', 'UPSC Prelims (Modern History).'],
    ['Geography', 'The Strait of Malacca is one of the world’s busiest shipping lanes.', 'It links the Andaman Sea (Indian Ocean) with the South China Sea (Pacific); tens of thousands of vessels pass yearly.', 'Core of Indo-Pacific geography and energy-security questions.', 'UPSC Prelims (Geography) + GS-II (IR).'],
    ['Space', 'Aryabhata, launched in 1975, was India’s first satellite.', 'Named after the 5th-century mathematician; launched by a Soviet rocket from Kapustin Yar.', 'Starting point of India’s space journey — ISRO anniversaries trigger questions.', 'UPSC Prelims (Science & Tech).'],
    ['Environment', 'India is one of the world’s 17 megadiverse countries.', 'It hosts 4 of the world’s 36 biodiversity hotspots — Himalaya, Western Ghats–Sri Lanka, Indo-Burma and Sundaland (Nicobar Islands).', 'Megadiverse status + hotspot locations are prelims staples.', 'UPSC Prelims (Environment).'],
    ['Polity', 'Article 21 has been expanded by judicial interpretation far beyond its text.', 'Right to life now includes livelihood, shelter, health, a clean environment and speedy trial (multiple SC rulings).', 'Example of judicial expansion of rights — GS-II mains favourite.', 'UPSC GS-II (Polity).'],
    ['Science', 'Quantum computers use qubits that can hold a superposition of states.', 'Unlike bits (0/1), qubits exploit superposition and entanglement for certain computations.', 'National Quantum Mission (₹6,003 crore, 2023) is a hot current+static crossover.', 'UPSC GS-III (S&T).'],
    ['Economy', 'India’s GST has four main slabs: 5%, 12%, 18% and 28%.', 'Essentials sit at 0–5%; luxury and sin goods attract 28% plus cess.', 'GST structure changes are perennial current-affairs material.', 'UPSC GS-III (Economy).'],
    ['World', 'The UN Charter was signed in San Francisco on 26 June 1945.', 'It entered into force on 24 October 1945 — now celebrated as UN Day.', 'UN bodies and charters recur in IR and polity questions.', 'UPSC Prelims (IR).'],
    ['India', 'Dolphin’s Nose headland shelters one of Asia’s finest natural harbours at Visakhapatnam.', 'The 17th-century anchorage is why the port city grew into India’s key eastern naval base.', 'Links geography with economy and defence — a strong mains link.', 'APPSC + UPSC Prelims (Geography).'],
  ];

  const fun: [string, string, string][] = [
    ['Octopuses have three hearts — and blue blood.', 'Two hearts pump blood to the gills, one to the body; their blood uses copper-based hemocyanin instead of iron.', 'Science'],
    ['Honey never spoils — 3,000-year-old edible honey was found in Egyptian tombs.', 'Its low moisture and acidic pH make it inhospitable to microbes.', 'Science'],
    ['India’s postal network is the world’s largest, with over 1.5 lakh post offices.', 'The floating post office on Dal Lake, Srinagar, is a unique branch.', 'India'],
    ['A day on Venus is longer than its year.', 'Venus rotates once in ~243 Earth days but orbits the Sun in ~225.', 'Space'],
    ['Bananas are berries, but strawberries are not.', 'Botanically, berries develop from a single ovary; strawberries don’t.', 'Science'],
    ['Antarctica is the largest desert on Earth.', 'Deserts are defined by precipitation, not heat — the interior gets less than 50 mm a year.', 'Geography'],
  ];

  const learning: [string, string, string, string, string | null][] = [
    ['Understand: Repo Rate', 'The rate at which the RBI lends short-term money to banks against securities. It is the main lever to control inflation and demand.', 'Repo changes flow to loan EMIs and deposit rates — touching every household and business.', 'GS-III Economy; recurring prelims fact.', 'MPC announces its decision at bi-monthly meetings.'],
    ['Understand: Article 356', 'President’s Rule: if a state’s governance fails constitutionally, the Centre takes over under Art. 356, on the Governor’s report or otherwise.', 'Tests federalism’s fault-lines — SC review (S.R. Bommai) limits misuse.', 'GS-II Polity; frequent mains theme.', 'S.R. Bommai case (1994) allows judicial review.'],
    ['Understand: Strait of Malacca', 'A ~900-km strait between Malaysia, Indonesia and Singapore linking the Indian and Pacific Oceans — Asia’s energy lifeline.', 'A large share of Asia’s oil imports transit it; India’s Andaman command sits near its mouth.', 'GS-II IR + GS-I Geography.', 'The “Malacca Dilemma” describes China’s dependency.'],
    ['Understand: El Niño', 'Warming of the central-eastern Pacific that weakens trade winds, often denting India’s monsoon and farm output.', 'Monsoon failure links to food inflation, rural demand and GDP — a classic chain-of-impact question.', 'GS-I Geography + GS-III Economy.', 'The opposite phase is La Niña; the cycle is ENSO.'],
    ['Understand: Article 21', '“No person shall be deprived of his life or personal liberty except according to procedure established by law.”', 'Judicially expanded to livelihood, health, environment and privacy — the most expansive right.', 'GS-II Polity mains anchor.', 'Maneka Gandhi (1978) reshaped its interpretation.'],
    ['Understand: LAC vs LoC', 'LAC: the ill-defined India–China border line; LoC: the military line with Pakistan flowing from the 1972 Simla Agreement.', 'Different histories and disputes — a common prelims trap.', 'GS-II IR + security.', 'LoC emerged from the 1972 Shimla Agreement.'],
    ['Understand: Fiscal Deficit', 'Total expenditure minus total receipts excluding borrowings — how much the government must borrow in a year.', 'It shapes interest rates, inflation and the debt burden passed to future taxpayers.', 'GS-III Economy; budget-season staple.', 'FRBM Act sets deficit targets.'],
  ];

  const tools: [string, string, string, string, string | null, string][] = [
    ['NotebookLM', 'https://notebooklm.google.com', 'Upload your notes and PDFs to get grounded summaries, FAQs and audio overviews.', 'Students and researchers', 'Free tier limits uploads and daily audio overviews.', 'Turns a 100-page PIB PDF into a 10-minute audio revision — perfect before mocks.'],
    ['Perplexity', 'https://www.perplexity.ai', 'AI answer engine with cited sources for research questions.', 'Quick, source-backed answers', 'Pro searches are limited per day on the free tier.', 'Cited answers make it safe for fact-checking current affairs.'],
    ['Google Pinpoint', 'https://pinpoint.withgoogle.com', 'Search and organize large document sets — budgets, reports, judgments.', 'Document-heavy research', 'Free with a Google account; generous limits.', 'Great for digging through the Economic Survey or ARC reports.'],
    ['Hugging Face Spaces', 'https://huggingface.co/spaces', 'Try thousands of free community AI demos — translation, OCR, summarization.', 'Experimenting with AI hands-on', 'Free CPU demos; queues at peak times.', 'See exactly how models behave — builds genuine AI literacy.'],
    ['Wolfram Alpha', 'https://www.wolframalpha.com', 'Computational knowledge engine for math, data and science facts.', 'CSAT and data-interpretation practice', 'Free web access; paid app features.', 'Step-by-step math helps CSAT quant practice without heavy software.'],
    ['Gamma', 'https://gamma.app', 'Generate clean presentations from a prompt or document.', 'Quick revision decks', 'Free credits per month.', 'Turn a current-affairs PDF into a visual deck in minutes.'],
  ];

  const insertFact = d.prepare(
    `INSERT INTO facts (id, kind, category, title, body, why_it_matters, context, exam_relevance, key_fact, meta)
     VALUES (?,?,?,?,?,?,?,?,?,?)`
  );

  for (const [category, title, body, why, exam] of facts) {
    insertFact.run(
      `fact-${title.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      'fact', category, title, body, why, null, exam, null, '{}'
    );
  }
  for (const [title, body, category] of fun) {
    insertFact.run(
      `fun-${title.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      'fun', category, title, body, null, null, null, null, '{}'
    );
  }
  for (const [title, simple, whyMatters, exam, extra] of learning) {
    insertFact.run(
      `learn-${title.slice(0, 24).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      'learning', null, title, simple, whyMatters, extra, exam, null, '{}'
    );
  }
  for (const [name, url, what, best, limits, whyStudents] of tools) {
    insertFact.run(
      `tool-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      'tool', null, name, what, whyStudents, null, null, null,
      JSON.stringify({ url, best_for: best, free_limits: limits })
    );
  }

  // Assign today's rotation immediately after seeding.
  const today = istDateKey();
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const kinds: [string, number][] = [['fact', 1], ['fun', 1], ['tool', 1], ['learning', 4]];
  for (const [kind, n] of kinds) {
    const rows = d.prepare(`SELECT id FROM facts WHERE kind = ?`).all(kind) as { id: string }[];
    for (let i = 0; i < Math.min(n, rows.length); i++) {
      d.prepare('UPDATE facts SET date = ? WHERE id = ?').run(today, rows[(dayIndex + i) % rows.length].id);
    }
  }
}
