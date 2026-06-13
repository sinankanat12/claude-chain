import { ping } from './pinger.js';
import { waitUntilNext } from './scheduler.js';
import { logger } from './logger.js';

const MAX_CONSECUTIVE_RETRIES = 3;

function validateEnv(): void {
  const pingIntervalMs = parseInt(process.env.PING_INTERVAL_MS ?? '17700000', 10);
  if (isNaN(pingIntervalMs) || pingIntervalMs < 60_000) {
    logger.fatal('PING_INTERVAL_MS geçersiz. Minimum 60000 (1 dakika).');
    process.exit(1);
  }

  logger.info(`Yapılandırma: ping_interval=${formatMs(pingIntervalMs)}, reset_buffer=${formatMs(parseInt(process.env.RESET_BUFFER_MS ?? '300000', 10))}`);
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('claude-chain başlatıldı.');

  let consecutiveRetries = 0;

  while (true) {
    logger.info('Ping gönderiliyor...');
    const result = await ping();
    const action = await waitUntilNext(result);

    if (action === 'retry') {
      consecutiveRetries++;
      if (consecutiveRetries >= MAX_CONSECUTIVE_RETRIES) {
        logger.fatal(`${MAX_CONSECUTIVE_RETRIES} ardışık başarısız deneme. Çıkılıyor.`);
        process.exit(1);
      }
    } else {
      consecutiveRetries = 0;
    }
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[FATAL] Beklenmeyen hata: ${msg}`);
  process.exit(1);
});
