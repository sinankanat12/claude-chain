import { ping } from './pinger.js';
import { waitUntilNext } from './scheduler.js';
import { logger } from './logger.js';

const MAX_CONSECUTIVE_RETRIES = 3;

function validateEnv(): void {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    logger.fatal('CLAUDE_CODE_OAUTH_TOKEN eksik. "claude setup-token" ile token alın, Railway env var olarak ekleyin.');
    process.exit(1);
  }
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
