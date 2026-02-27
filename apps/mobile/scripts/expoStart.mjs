import net from 'node:net';
import { spawn } from 'node:child_process';

function hasArg(args, name) {
  return args.includes(name) || args.some((a) => a.startsWith(`${name}=`));
}

function getArgValue(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1) return args[idx + 1];
  const pref = `${name}=`;
  const hit = args.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : undefined;
}

async function isPortFree(port) {
  return await new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1' }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPort(preferred) {
  // Expo/Metro default.
  const start = Number.isFinite(preferred) ? preferred : 8081;

  // Try a small, predictable range.
  for (let port = start; port <= start + 9; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }

  // Fall back: just use the preferred port (Expo will error/prompt).
  return start;
}

async function main() {
  const args = process.argv
    .slice(2)
    // pnpm on Windows can sometimes surface quoted args; normalize defensively.
    .map((a) => (a.length >= 2 && a.startsWith('"') && a.endsWith('"') ? a.slice(1, -1) : a));

  // If caller explicitly set a port, don't interfere.
  if (!hasArg(args, '--port')) {
    const envPort = Number.parseInt(process.env.EXPO_METRO_PORT || '', 10);
    const preferred = Number.isFinite(envPort) ? envPort : 8081;
    const port = await pickPort(preferred);
    if (port !== preferred) {
      console.log(`› Metro port ${preferred} is busy; using ${port}`);
    }
    args.push('--port', String(port));
  }

  const child = spawn('expo', ['start', ...args], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  });

  child.on('error', (err) => {
    console.error(err);
    process.exitCode = 1;
  });

  child.on('exit', (code) => {
    process.exitCode = code ?? 0;
  });
}

main().catch((err) => {
  // Keep failure visible in CI.
  console.error(err);
  process.exitCode = 1;
});
