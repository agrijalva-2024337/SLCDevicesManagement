import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const srcRoot = path.resolve(import.meta.dirname, '../src');

function resolveAlias(specifier) {
  const relative = specifier.slice(2);
  const base = path.join(srcRoot, relative);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return pathToFileURL(`${base}.js`).href;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return {
      shortCircuit: true,
      url: resolveAlias(specifier),
    };
  }
  return nextResolve(specifier, context);
}
