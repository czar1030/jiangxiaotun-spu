import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logs = resolve(root, 'logs');
mkdirSync(logs, { recursive: true });
const record = resolve(logs, 'public-runtime.json');
const binary = resolve(root, 'tools/cloudflared.exe');
let previous;
try { previous = JSON.parse(readFileSync(record, 'utf8')); } catch { /* First start. */ }
function ownsProcess(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    const path = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `(Get-Process -Id ${pid} -ErrorAction Stop).Path`], { windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return path.toLowerCase() === binary.toLowerCase();
  } catch { return false; }
}
if (process.argv.includes('--stop')) {
  if (previous && ownsProcess(previous.pid)) { process.kill(previous.pid); console.log('公网通道已停止，本机网页仍可使用。'); }
  else console.log('公网通道已停止或没有匹配的通道进程。');
  process.exit(0);
}
await import('./start.mjs');
if (previous && ownsProcess(previous.pid)) {
  try {
    if (!previous.url) throw new Error('Previous tunnel did not finish startup');
    const response = await fetch(previous.url + '/api/health', { signal: AbortSignal.timeout(12000) });
    if (response.ok && (await response.json()).app === 'wuhan-spu-concierge') {
      console.log(`公网链接：${previous.url}\n电脑需保持开机、联网；重建通道后链接可能改变。`);
      process.exit(0);
    }
  } catch { /* Rebuild an unavailable tunnel. */ }
  process.kill(previous.pid);
}
if (!existsSync(binary)) throw new Error('缺少tools/cloudflared.exe，请先下载Cloudflare官方Windows客户端。');
const env = readFileSync(resolve(root, '.env'), 'utf8');
const port = Number(env.match(/^PORT=(\d+)$/m)?.[1] || 3210);
const logFile = resolve(logs, `tunnel-${Date.now()}.log`);
const fd = openSync(logFile, 'a');
const child = spawn(binary, ['tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${port}`, '--protocol', 'http2'], {
  cwd: root, detached: true, windowsHide: true, stdio: ['ignore', fd, fd]
});
child.unref(); closeSync(fd);
let spawnError;
child.on('error', error => { spawnError = error; });
writeFileSync(record, JSON.stringify({ pid: child.pid, logFile, createdAt: new Date().toISOString() }, null, 2));
for (let i = 0; i < 110; i++) {
  if (spawnError) throw spawnError;
  await new Promise(resolve => setTimeout(resolve, 500));
  const log = readFileSync(logFile, 'utf8');
  const url = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
  if (url && log.includes('Registered tunnel connection')) {
    writeFileSync(record, JSON.stringify({ pid: child.pid, url, logFile, createdAt: new Date().toISOString() }, null, 2));
    writeFileSync(resolve(logs, '公网链接.txt'), `${url}\n电脑需保持开机、联网；重建通道后链接可能改变。\n`);
    console.log(`公网链接：${url}\n电脑需保持开机、联网；重建通道后链接可能改变。`);
    process.exit(0);
  }
}
throw new Error(`公网通道尚未连接，请查看${logFile}，或重新运行启动器。`);
