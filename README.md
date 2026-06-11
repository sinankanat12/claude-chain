# claude-chain

Chains Claude Code 5-hour usage windows automatically. Runs as a persistent Railway service.

## How it works

1. Sends `claude --print "1"` every ~4h55m
2. On rate limit: parses reset time from output, waits until reset + 5 min
3. Logs every action with timestamps

## Setup

### 1. Get OAuth token

```bash
claude setup-token
```

Copy the token output.

### 2. Deploy to Railway

1. New Project → Deploy from GitHub repo → select this repo
2. Variables tab → add `CLAUDE_CODE_OAUTH_TOKEN=<token from step 1>`
3. Deploy

### 3. Verify

```bash
railway logs
```

You should see ping lines every ~4h55m.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | ✅ | — | From `claude setup-token` |
| `PING_INTERVAL_MS` | ❌ | `17700000` | Ping frequency (4h55m) |
| `RESET_BUFFER_MS` | ❌ | `300000` | Buffer after reset (5m) |
| `PING_MESSAGE` | ❌ | `"1"` | Message sent to Claude |
| `LOG_LEVEL` | ❌ | `INFO` | Log verbosity |

## Log format

```
[2026-06-11 22:05:01] [INFO ] Ping gönderiliyor...
[2026-06-11 22:05:03] [OK   ] Başarılı. Sonraki ping: 4s55dk sonra (05:00:03).
[2026-06-11 05:00:01] [INFO ] Ping gönderiliyor...
[2026-06-11 05:00:04] [WARN ] Rate limit. Reset: 10:05:00. Bekleniyor... (5dk)
[2026-06-11 10:10:01] [OK   ] Başarılı. Sonraki ping: 4s55dk sonra (15:05:01).
```
