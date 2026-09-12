/** db:init — create schema, seed pools, register categories/sources, optional first ingest. */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { loadEnvFile } from './env.mjs';

loadEnvFile();
register('./scripts/alias-loader.mjs', pathToFileURL('./'));

const { db } = await import('../src/lib/db/index.ts');
const { seedIfEmpty } = await import('../src/lib/db/seed.ts');
const { CATEGORIES } = await import('../src/lib/config.ts');
const { syncSources } = await import('../src/lib/db/queries.ts');
const { SOURCE_CATALOG } = await import('../src/lib/news/sources.ts');
const { runIngestion } = await import('../src/lib/news/ingest.ts');

db();
seedIfEmpty();

const insertCat = db().prepare(
  `INSERT INTO categories (slug, label, short, description, parent, weight, icon)
   VALUES (?,?,?,?,?,?,?)
   ON CONFLICT(slug) DO UPDATE SET label=excluded.label, short=excluded.short, description=excluded.description`
);
for (const c of CATEGORIES) insertCat.run(c.slug, c.label, c.short, c.description, c.parent, c.weight, c.icon);

syncSources(SOURCE_CATALOG);

const live = process.argv.includes('--live');
if (live) {
  console.log('Running live ingestion…');
  const result = await runIngestion('live');
  console.log('Ingestion result:', JSON.stringify(result, null, 2));
} else {
  console.log('Running offline demo ingestion (use --live for live sources)…');
  const result = await runIngestion('demo');
  console.log('Ingestion result:', JSON.stringify(result, null, 2));
}

// Rebuild FTS5 search index
const { rebuildFTSIndex } = await import('../src/lib/db/queries.ts');
try {
  rebuildFTSIndex();
  console.log('FTS5 search index rebuilt.');
} catch (e) {
  console.log('FTS5 index rebuild skipped (will auto-populate on next insert).');
}

console.log('Database ready.');
