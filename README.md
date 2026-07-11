# 🚦 Distributed Rate Limiter

A Redis-backed rate limiting middleware for Node.js/Express, implementing four classic rate limiting algorithms behind a single pluggable interface. Built with the **Strategy Pattern** so the algorithm used per-route (or per-app) is just a config value.

---

## ✨ Features

- **Four algorithms**, selectable via config: Fixed Window, Sliding Window, Token Bucket, Leaky Bucket
- **Distributed by design** — state lives in Redis, so rate limits are shared correctly across multiple app instances
- **Atomic per-request keys** via a pluggable `keyGenerator` (defaults to client IP)
- **Standard rate-limit response headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- **Config validation on startup** — invalid limits, windows, or algorithm names fail fast
- Ships as Express middleware — drop it into any route or the whole app with one line

---

## 🛠 Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Express 5
- **Store:** Redis 7 (via the official `redis` npm client)
- **Config:** dotenv
- **Dev:** nodemon


---

## ⚙️ How It Works

```
Client Request
      │
      ▼
Express App
      │
Rate Limiter Middleware  ──▶  validateConfig()
      │
Algorithm Factory  ──▶  picks algorithm from config.algorithm
      │
Selected Algorithm  ──▶  reads/writes state in Redis
      │
      ▼
Allow (next()) or Block (429 + Retry-After)
```

Each request generates a Redis key via `config.keyGenerator` (client IP by default), and the selected algorithm decides allow/deny using that key.

---

## 📊 Algorithms

| Algorithm | Redis structure | Notes |
|---|---|---|
| **Fixed Window** | `INCR` + `EXPIRE` | Simplest and fastest; can allow bursts at window boundaries |
| **Sliding Window** | Sorted Set (`ZADD`/`ZREMRANGEBYSCORE`) | Tracks individual request timestamps for smoother limiting |
| **Token Bucket** | JSON blob per key | Allows bursts up to `capacity`, refills at `refillRate`/sec |
| **Leaky Bucket** | JSON blob per key | Smooths bursts into a steady outflow at `leakRate`/sec |

---

## 📝 Response Behavior

- **Allowed:** request proceeds; `X-RateLimit-Remaining` and `X-RateLimit-Limit` headers are set
- **Blocked:** `429 Too Many Requests` with a `Retry-After` header and a JSON body:
  ```json
  { "success": false, "message": "Too many requests." }
  ```
