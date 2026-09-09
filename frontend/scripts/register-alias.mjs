import { register } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const hooks = pathToFileURL(path.join(import.meta.dirname, 'alias-hooks.mjs')).href;
register(hooks, pathToFileURL(import.meta.dirname).href);
