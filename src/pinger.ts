import { spawn } from 'node:child_process';

export interface PingResult {
  success: boolean;
  output: string;
  exitCode: number;
}

const TIMEOUT_MS = 30_000;

export async function ping(): Promise<PingResult> {
  const message = process.env.PING_MESSAGE ?? '1';

  return new Promise((resolve) => {
    const proc = spawn('claude', ['--print', message], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let output = '';
    proc.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { output += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill();
      resolve({ success: false, output: 'TIMEOUT: claude --print exceeded 30s', exitCode: -1 });
    }, TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        output: output.trim(),
        exitCode: code ?? -1,
      });
    });

    proc.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      const msg = err.code === 'ENOENT'
        ? 'claude CLI not found — install @anthropic-ai/claude-code'
        : err.message;
      resolve({ success: false, output: msg, exitCode: -1 });
    });
  });
}
