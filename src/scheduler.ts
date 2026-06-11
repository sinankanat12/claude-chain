import { PingResult } from './pinger.js';
import { parseResetTime } from './parser.js';
import { logger } from './logger.js';

const PING_INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS ?? '17700000', 10);
const WEEKLY_LIMIT_WAIT_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAY_MS = 5 * 60 * 1000;

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isCliNotFound(result: PingResult): boolean {
  return result.output.includes('claude CLI not found') || result.output.includes('ENOENT');
}

function isAuthError(result: PingResult): boolean {
  const lower = result.output.toLowerCase();
  return (
    lower.includes('authentication failed') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid token') ||
    lower.includes('invalid api key')
  );
}

function isWeeklyLimit(result: PingResult): boolean {
  const lower = result.output.toLowerCase();
  return lower.includes('weekly') && lower.includes('limit');
}

function isRateLimit(result: PingResult): boolean {
  const lower = result.output.toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('usage limit') ||
    lower.includes('resets at') ||
    lower.includes('reset_at') ||
    lower.includes('resets in')
  );
}

export async function waitUntilNext(result: PingResult): Promise<'ok' | 'retry'> {
  if (result.success) {
    const next = new Date(Date.now() + PING_INTERVAL_MS);
    logger.ok(`Başarılı. Sonraki ping: ${formatDuration(PING_INTERVAL_MS)} sonra (${next.toLocaleTimeString()}).`);
    await sleep(PING_INTERVAL_MS);
    return 'ok';
  }

  if (isCliNotFound(result)) {
    logger.fatal('claude CLI bulunamadı. npm install -g @anthropic-ai/claude-code ile kurun.');
    process.exit(1);
  }

  if (isAuthError(result)) {
    logger.fatal(`Auth hatası: ${result.output}`);
    process.exit(1);
  }

  if (isWeeklyLimit(result)) {
    logger.warn('Weekly limit aşıldı. 24 saat bekleniyor...');
    await sleep(WEEKLY_LIMIT_WAIT_MS);
    return 'ok';
  }

  if (isRateLimit(result)) {
    const parsed = parseResetTime(result.output);
    const resetStr = parsed.resetTime
      ? parsed.resetTime.toLocaleTimeString()
      : '(bilinmiyor)';
    logger.warn(`Rate limit. Reset: ${resetStr}. Bekleniyor... (${formatDuration(parsed.waitMs)})`);
    await sleep(parsed.waitMs);
    return 'ok';
  }

  logger.error(`Bilinmeyen hata (exit ${result.exitCode}): ${result.output.slice(0, 200)}`);
  logger.info(`${formatDuration(RETRY_DELAY_MS)} sonra tekrar denenecek.`);
  await sleep(RETRY_DELAY_MS);
  return 'retry';
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0 && m > 0) return `${h}s ${m}dk`;
  if (h > 0) return `${h}s`;
  return `${m}dk`;
}
