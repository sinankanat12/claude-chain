# claude-chain

Claude Code 5 saatlik oturum pencerelerini otomatik olarak zincirler. Docker ile yerel makinede çalışır.

## Nasıl çalışır

1. Her ~4s55dk'da bir `claude --print "1"` gönderir
2. Rate/session limit gelince reset zamanını parse eder, reset + 5dk bekler
3. Her işlemi timestamp ile loglar

## Kurulum

### 1. OAuth token al

```bash
claude setup-token
```

### 2. .env dosyası oluştur

```bash
cp .env.example .env
# CLAUDE_CODE_OAUTH_TOKEN değerini doldur
```

### 3. Docker ile çalıştır

```bash
docker build -t claude-chain .
docker run -d --env-file .env --name claude-chain claude-chain
```

### 4. Logları izle

```bash
docker logs -f claude-chain
```

## Environment Variables

| Değişken | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | ✅ | — | `claude setup-token` çıktısı |
| `PING_INTERVAL_MS` | ❌ | `17700000` | Ping sıklığı (4s55dk) |
| `RESET_BUFFER_MS` | ❌ | `300000` | Reset sonrası bekleme (5dk) |
| `PING_MESSAGE` | ❌ | `"1"` | Claude'a gönderilen mesaj |
| `LOG_LEVEL` | ❌ | `INFO` | Log seviyesi |

## Log formatı

```
[2026-06-11 22:05:01] [INFO ] Ping gönderiliyor...
[2026-06-11 22:05:03] [OK   ] Başarılı. Sonraki ping: 4s55dk sonra (05:00:03).
[2026-06-11 05:00:01] [INFO ] Ping gönderiliyor...
[2026-06-11 05:00:04] [WARN ] Rate limit. Reset: 10:05:00. Bekleniyor... (5dk)
[2026-06-11 10:10:01] [OK   ] Başarılı. Sonraki ping: 4s55dk sonra (15:05:01).
```
