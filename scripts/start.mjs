import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, openSync, closeSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = existsSync(resolve(root, '.env')) ? readFileSync(resolve(root, '.env'), 'utf8') : '';
const port = Number(env.match(/^PORT=(\d+)$/m)?.[1] || process.env.PORT || 3210);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('请将PORT设置为1024—65535的端口。');
const url = `http://127.0.0.1:${port}`;
const getHealth = async () => {
  try { const r = await fetch(url + '/api/health', { signal: AbortSignal.timeout(1500) }); if (r.ok) return await r.json(); } catch { /* Not running yet. */ }
  return null;
};
let health = await getHealth();
if (health && health.app !== 'wuhan-spu-concierge') throw new Error(`端口${port}已被其他应用占用，请更改.env中的PORT。`);
if (!health) {
  const logs = resolve(root, 'logs'); mkdirSync(logs, { recursive: true });
  const stdout = openSync(resolve(logs, 'server.log'), 'a');
  const stderr = openSync(resolve(logs, 'error.log'), 'a');
  const child = spawn(process.execPath, [resolve(root, 'server.mjs')], { cwd: root, detached: true, windowsHide: true, stdio: ['ignore', stdout, stderr] });
  child.unref(); closeSync(stdout); closeSync(stderr);
  for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 300)); health = await getHealth(); if (health?.app === 'wuhan-spu-concierge') break; }
  if (!health) throw new Error('启动未成功，请查看logs/error.log；也可以在项目目录执行npm start查看原因。');
  writeFileSync(resolve(logs, 'runtime.json'), JSON.stringify({ pid: child.pid, port, instanceId: health.instanceId }, null, 2));
}
console.log(`江小豚已就绪：${url}`);
if (!process.argv.includes('--no-open')) {
  const child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/d', '/s', '/c', `start "" "${url}"`], { windowsHide: true, stdio: 'ignore', detached: true })
    : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { stdio: 'ignore', detached: true });
  child.unref();
}
