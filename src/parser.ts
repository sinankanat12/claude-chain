export interface ParseResult {
  waitMs: number;
  resetTime: Date | null;
  source: 'format-a' | 'format-b' | 'format-c' | 'format-d' | 'default';
}

const DEFAULT_WAIT_MS = 5 * 60 * 60 * 1000;

function bufferMs(): number {
  return parseInt(process.env.RESET_BUFFER_MS ?? '300000', 10);
}

export function parseResetTime(output: string): ParseResult {
  const buf = bufferMs();

  // Format D: "reset_at: <unix seconds or ms>"
  const unixMatch = output.match(/reset_at:\s*(\d{10,13})/);
  if (unixMatch) {
    const raw = parseInt(unixMatch[1], 10);
    const ts = raw < 1e12 ? raw * 1000 : raw;
    const resetTime = new Date(ts);
    const waitMs = Math.max(0, resetTime.getTime() - Date.now()) + buf;
    return { waitMs, resetTime, source: 'format-d' };
  }

  // Format A: "resets at 14:37 (Europe/Istanbul)"
  const fmtA = output.match(/resets?\s+at\s+(\d{1,2}):(\d{2})\s*\(([^)]+)\)/i);
  if (fmtA) {
    const targetH = parseInt(fmtA[1], 10);
    const targetM = parseInt(fmtA[2], 10);
    const tz = fmtA[3];
    const resetTime = nextOccurrenceInTZ(targetH, targetM, tz);
    const waitMs = Math.max(0, resetTime.getTime() - Date.now()) + buf;
    return { waitMs, resetTime, source: 'format-a' };
  }

  // Format B: "resets at 2:37 PM"
  const fmtB = output.match(/resets?\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (fmtB) {
    let h = parseInt(fmtB[1], 10);
    const m = parseInt(fmtB[2], 10);
    const ampm = fmtB[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const resetTime = nextOccurrenceLocal(h, m);
    const waitMs = Math.max(0, resetTime.getTime() - Date.now()) + buf;
    return { waitMs, resetTime, source: 'format-b' };
  }

  // Format C: "resets in X hours Y minutes" (each part optional)
  const fmtC = output.match(/resets?\s+in\s+(?:(\d+)\s*hours?\s*)?(?:(\d+)\s*minutes?)?/i);
  if (fmtC && (fmtC[1] || fmtC[2])) {
    const hours = parseInt(fmtC[1] ?? '0', 10);
    const minutes = parseInt(fmtC[2] ?? '0', 10);
    const relativeMs = (hours * 60 + minutes) * 60 * 1000;
    const resetTime = new Date(Date.now() + relativeMs);
    const waitMs = relativeMs + buf;
    return { waitMs, resetTime, source: 'format-c' };
  }

  return { waitMs: DEFAULT_WAIT_MS, resetTime: null, source: 'default' };
}

function nextOccurrenceLocal(targetH: number, targetM: number): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(targetH, targetM, 0, 0);
  if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

function nextOccurrenceInTZ(targetH: number, targetM: number, tz: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const tzH = parseInt(parts.find(p => p.type === 'hour')!.value, 10);
  const tzM = parseInt(parts.find(p => p.type === 'minute')!.value, 10);

  const currentTZMinutes = (tzH === 24 ? 0 : tzH) * 60 + tzM;
  const targetTZMinutes = targetH * 60 + targetM;

  let diffMs = (targetTZMinutes - currentTZMinutes) * 60 * 1000;
  if (diffMs <= 0) diffMs += 24 * 60 * 60 * 1000;

  return new Date(now.getTime() + diffMs);
}
