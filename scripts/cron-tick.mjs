/** cron:tick — trigger the update cycle via the protected HTTP endpoint. */
import { loadEnvFile } from './env.mjs';

loadEnvFile();
const base = process.env.PRISM_BASE_URL || 'http://127.0.0.1:3210';
const secret = process.env.CRON_SECRET || '';

const res = await fetch(`${base}/api/cron`, {
  method: 'POST',
  headers: secret ? { authorization: `Bearer ${secret}` } : {},
});
console.log(res.status, await res.text());
