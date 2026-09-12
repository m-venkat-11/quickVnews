/**
 * auto-ingest.mjs — Background scheduler that triggers a live ingestion
 * cycle every 6 hours aligned to IST slots (00:00 / 06:00 / 12:00 / 18:00).
 *
 * Run alongside the dev server:
 *   node scripts/auto-ingest.mjs
 *
 * Or use `npm run scheduler` (after adding the script to package.json).
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { loadEnvFile } from './env.mjs';

loadEnvFile();
register('./scripts/alias-loader.mjs', pathToFileURL('./'));

const { runIngestion } = await import('../src/lib/news/ingest.ts');

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30
const INTERVAL_HOURS = 6;
const SLOT_MS = INTERVAL_HOURS * 60 * 60 * 1000;

/** Returns ms until the next 6-hour IST boundary (00/06/12/18). */
function msUntilNextSlot() {
  const nowUTC = Date.now();
  const nowIST = nowUTC + IST_OFFSET_MS;

  const istDate = new Date(nowIST);
  const currentHour = istDate.getUTCHours();
  const currentMin = istDate.getUTCMinutes();
  const currentSec = istDate.getUTCSeconds();

  // Time elapsed within current 6h slot
  const hoursIntoSlot = currentHour % INTERVAL_HOURS;
  const msIntoSlot =
    hoursIntoSlot * 3600_000 +
    currentMin * 60_000 +
    currentSec * 1000;

  const msRemaining = SLOT_MS - msIntoSlot;

  // Add a 30-second buffer so feeds have time to publish
  return msRemaining + 30_000;
}

function formatIST(ms) {
  const d = new Date(ms + IST_OFFSET_MS);
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' IST';
}

async function runCycle() {
  const start = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[SCHEDULER] Starting live ingestion at ${formatIST(start)}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const result = await runIngestion('live');
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[SCHEDULER] Ingestion complete in ${elapsed}s`);
    console.log(`  Status:     ${result.status}`);
    console.log(`  Fetched:    ${result.fetched}`);
    console.log(`  Processed:  ${result.processed}`);
    console.log(`  Duplicates: ${result.duplicates}`);
    console.log(`  High-pri:   ${result.highPriority}`);
    console.log(`  Failed src: ${result.failedSources}`);
    if (result.notes) console.log(`  Notes:      ${result.notes}`);
  } catch (err) {
    console.error(`[SCHEDULER] Ingestion failed:`, err);
  }
}

async function loop() {
  console.log(`[SCHEDULER] PRISM CURRENT Auto-Ingest Scheduler`);
  console.log(`[SCHEDULER] Runs live ingestion every 6h at 00:00 / 06:00 / 12:00 / 18:00 IST`);
  console.log(`[SCHEDULER] Current time: ${formatIST(Date.now())}`);

  // Run first cycle immediately on start
  await runCycle();

  // Then loop on the 6h IST schedule
  while (true) {
    const waitMs = msUntilNextSlot();
    const nextTime = Date.now() + waitMs;
    console.log(`\n[SCHEDULER] Next cycle at ${formatIST(nextTime)} (in ${(waitMs / 60_000).toFixed(0)} minutes)`);
    console.log(`[SCHEDULER] Sleeping...`);

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    await runCycle();
  }
}

loop().catch((err) => {
  console.error('[SCHEDULER] Fatal error:', err);
  process.exit(1);
});
