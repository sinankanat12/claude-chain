type LogLevel = 'INFO' | 'OK' | 'WARN' | 'ERROR' | 'FATAL';

function log(level: LogLevel, message: string): void {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] [${level.padEnd(5)}] ${message}`);
}

export const logger = {
  info:  (msg: string) => log('INFO',  msg),
  ok:    (msg: string) => log('OK',    msg),
  warn:  (msg: string) => log('WARN',  msg),
  error: (msg: string) => log('ERROR', msg),
  fatal: (msg: string) => log('FATAL', msg),
};
