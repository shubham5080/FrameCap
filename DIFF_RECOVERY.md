# FrameCap — Diff failure recovery

Use when **Run Diff (prize demo)** fails or hangs. Keep the tab open; Diff often takes **1–3 minutes**.

---

## First response (always)

1. Read the red **StatusLine** + mono error under Diff  
2. **Retry Diff once** (same quota)  
3. If still failing → do **not** spam; use backup explorer + talk track  

Backup proof:  
https://explorer.altmempool.wtf/tx/0xedb83a3de6bfd8c16202d03f64af7094d5fe1b1d6662630861c8695352233daa

---

## Error → action

| You see | Meaning | Action |
|---------|---------|--------|
| Gateway unreachable / health red | Sidecar or network | Fix via `GATEWAY.md` first; Diff needs green health |
| Bad JSON / HTTP 5xx from `/api/diff-demo` | Local route or upstream timeout | Restart `npm run dev`; retry once |
| `StorageReadNonSender` on **canonical** | Expected | Not a failure — continue to alt / stake rows |
| Non-sender read on **alt before stake** | Expected | Continue — Diff will stake next |
| Stake / mine timeout | Faucet or block lag | Wait; retry Diff once; else backup explorer |
| `OverQuota` / `0xf11d2a44` on step 4 | Expected | Quota enforcement works |
| VERIFY gas / BannedOpcode | Contract / gas regression | Stop changing contracts; use explorer backup for mentors |
| Faucet / rate limit | Too many deploys | Wait several minutes; Diff-only, skip smoke Frame |

---

## Mentor / video script if Diff dies

1. “Same spine we already mined — here’s the explorer proof.”  
2. Open backup tx link  
3. Point at Raw RPC idea: `eth_sendRawTransaction` vs `eth_sendFrameTransaction`  
4. Offer stake-status paste if a wallet address from an earlier run is still on screen  

---

## Pass criteria (even after a failure)

Judges still need: **canonical reject + alt admit + over-quota block**.  
Live Diff is best; explorer backup is acceptable if the gateway flakes mid-talk.
