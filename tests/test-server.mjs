import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp as createRealApp} from '../server.mjs';
export {root, sanitizeReply} from '../server.mjs';

// Mocked online tests must not depend on a developer's real .env or key.
export function createApp(options = {}) {
  if (!options.generator) return createRealApp(options);
  const directory = mkdtempSync(join(tmpdir(), 'spu-http-test-'));
  const server = createRealApp({
    config:{key:'unit-test-placeholder-not-a-real-key', model:'test', baseUrl:'https://invalid.example', style:'responses'},
    env:{NODE_ENV:'test', AI_ENABLED:'true', AI_USAGE_FILE:join(directory,'usage.json')},
    ...options
  });
  server.once('close', () => rmSync(directory,{recursive:true,force:true}));
  return server;
}
