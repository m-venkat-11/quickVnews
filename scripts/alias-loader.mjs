/**
 * Module hooks so plain `node scripts/*.mjs` can import the app's TypeScript
 * sources. Node 22.5+ strips TS types natively; this hook resolves specifiers:
 *  - `@/x` → src/x.(ts|tsx|index.ts)
 *  - relative './x' / '../x' → x.ts or x/index.ts when the bare form misses
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function candidates(base) {
  return [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const base = path.join(root, 'src', specifier.slice(2));
    for (const cand of candidates(base)) {
      if (existsSync(cand)) return nextResolve(pathToFileURL(cand).href, context);
    }
    throw new Error(`alias-loader: cannot resolve ${specifier}`);
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    // Only probe candidates when parent is inside our src tree.
    if (path.resolve(parentDir).startsWith(path.join(root, 'src'))) {
      const base = path.resolve(parentDir, specifier);
      for (const cand of candidates(base)) {
        if (existsSync(cand) && !cand.endsWith('.mjs')) {
          return nextResolve(pathToFileURL(cand).href, context);
        }
      }
    }
  }

  return nextResolve(specifier, context);
}
