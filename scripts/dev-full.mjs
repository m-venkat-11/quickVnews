/**
 * dev-full.mjs — Starts both the Next.js dev server and the 6h auto-ingest
 * scheduler as parallel child processes. Works on Windows, macOS, and Linux.
 *
 * Usage: node scripts/dev-full.mjs
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function spawnProcess(label, cmd, args) {
  const proc = spawn(cmd, args, {
    cwd: root,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env },
  });

  proc.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      console.log(`[${label}] ${line}`);
    }
  });

  proc.stderr.on('data', (data) => {
    for (const line of data.toString().split('\n').filter(Boolean)) {
      console.error(`[${label}] ${line}`);
    }
  });

  proc.on('exit', (code) => {
    console.log(`[${label}] Exited with code ${code}`);
  });

  return proc;
}

console.log('============================================================');
console.log('  PRISM CURRENT — Full Development Mode');
console.log('  Next.js dev server + 6h auto-ingest scheduler');
console.log('============================================================\n');

const devServer = spawnProcess('DEV', 'node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3210']);
const scheduler = spawnProcess('INGEST', 'node', ['scripts/auto-ingest.mjs']);

// Clean shutdown: kill both on Ctrl+C
function cleanup() {
  console.log('\n[MAIN] Shutting down...');
  devServer.kill();
  scheduler.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
