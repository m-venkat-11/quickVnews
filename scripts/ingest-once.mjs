/**
 * ingest — run a single update cycle from the CLI.
 * Suitable for GitHub Actions cron or any external scheduler:
 *   `node scripts/ingest-once.mjs --live`
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { loadEnvFile } from './env.mjs';

loadEnvFile();
register('./scripts/alias-loader.mjs', pathToFileURL('./'));

const mode = process.argv.includes('--live') ? 'live' : 'demo';
const { runIngestion } = await import('../src/lib/news/ingest.ts');

const result = await runIngestion(mode);
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === 'failed' ? 1 : 0);
