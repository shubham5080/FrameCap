# FrameCap — gateway harden notes

Workshop sidecar used by the Diff spine. Pin matches `src/lib/config.ts`.

| | |
|--|--|
| RPC | `https://altmempoolgateway.forshtat.com/rpc` |
| Explorer | `https://explorer.altmempool.wtf/` |
| Chain | `1337` |
| Profile | `ethrex-eip8141-tracer` |
| Registry | `0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f` |

---

## Pre-demo health (UI)

1. Open http://127.0.0.1:43127 → **Enter FrameCap** (`/app`)  
2. **Alt mempool gateway** → **Recheck**  
3. Expect: Status **reachable**, Chain **1337**, Faucet **enabled**  
4. If red → do **not** start Diff; fix health first  

API check: `GET /api/health` (same fields as the panel).

---

## Common failures

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Health unreachable / fetch failed | Laptop offline or gateway down | Recheck; wait 30s; try once more |
| Chain ID blank / wrong | Sidecar proxy hiccup | Recheck; confirm `config.chainId === 1337` |
| Faucet disabled / unknown | Workshop faucet paused | Retry smoke Frame later; Diff may still work if wallets already funded |
| Health HTTP 5xx | Local Next route or upstream | Restart `npm run dev`; recheck |
| Diff hangs >3 min | Mine / faucet queue | Keep tab open; narrate; use explorer backup if needed |
| `VERIFY` gas / BannedOpcode | Contract regression | Do **not** change contracts mid-harden without a test; fall back to explorer proofs |
| Rate limit / faucet spam | Too many smoke Frames | Prefer Diff-only; wait before retry |

---

## Smoke vs Diff

- **Send smoke Frame** — optional warm-up only  
- **Run Diff (prize demo)** — prize spine; needs healthy gateway + faucet for fresh deploys  

If smoke fails but health is green: still try Diff once. If Diff fails after one retry: use backup explorer links from `DEMO_TALK_TRACK.md` / `MENTOR_NOTES.md`.

---

## Mentors / video

Say: “Gateway is the workshop alt-mempool sidecar — same chain 1337 the EF track uses.”  
Do not claim we host the mempool.
