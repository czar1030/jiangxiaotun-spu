import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const path = resolve(dirname(fileURLToPath(import.meta.url)), '../logs/runtime.json');
if (!existsSync(path)) { console.log('没有由启动器创建的后台服务记录；若用npm start启动，请在对应窗口按Ctrl+C。'); process.exit(0); }
const runtime = JSON.parse(readFileSync(path, 'utf8'));
let health;
try { health = await (await fetch(`http://127.0.0.1:${runtime.port}/api/health`, { signal: AbortSignal.timeout(2000) })).json(); }
catch { console.log('服务已停止。'); process.exit(0); }
if (health.app !== 'wuhan-spu-concierge' || health.instanceId !== runtime.instanceId) throw new Error('服务实例已变化，为避免误关闭其他程序，请手动检查。');
process.kill(runtime.pid);
console.log('江小豚已停止。');
