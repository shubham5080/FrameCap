# FrameCap — mentor desk notes

**One-liner:** Daily spend quota in Frame VERIFY — canonical rejects foreign ledger read; staked alt admits; over-quota still fails.

**Repo:** https://github.com/shubham5080/FrameCap  
**Live UI:** http://127.0.0.1:43127 · Diff button = prize spine  
**Prize:** EF — Best use of the Frame Transaction Alternative Mempool

---

## What to show (90s)

1. Open app → gateway **reachable**  
2. Quota form → e.g. **5 gwei** → Use for Diff  
3. **Run Diff (prize demo)** — narrate while it mines (1–3 min)  
4. Point at four rows: canonical ❌ → alt pre-stake ❌ → alt post-stake ✅ → over-quota ❌  
5. Flash **Raw RPC evidence** (`eth_sendRawTransaction` vs `eth_sendFrameTransaction`)  
6. Open one explorer link if time allows  

Backup explorer if gateway is slow:  
https://explorer.altmempool.wtf/tx/0xedb83a3de6bfd8c16202d03f64af7094d5fe1b1d6662630861c8695352233daa

---

## Likely mentor questions

| Question | Short answer |
|----------|----------------|
| Why not do this on the public mempool? | VERIFY may not SLOAD another contract’s storage (`StorageReadNonSender`). Quota ledger is foreign storage. |
| What does staking change? | Entity stakes ≥0.01 ETH on `NaiveStakingRegistry` → alt profile allows that flexible validation. |
| Is over-quota just UI? | No — VERIFY reverts `OverQuota` onchain after spend would exceed the daily limit. |
| Same bytes both paths? | Same Frame intent; admission policy differs (canonical raw vs `eth_sendFrameTransaction` + stake). |
| What contracts? | `QuotaLedger` (limit + spent) + `QuotaWallet` (Hegotá `fallback` → `remaining()` → `approve`). |
| Stack? | Next.js, viem, `@forshtat/hegota-support`, Foundry, workshop gateway chain **1337**. |
| AI? | Cursor-assisted — see `AI_USAGE.md`. Human ran live gateway proofs. |

---

## Architecture (whiteboard)

```
signer → Frame (VERIFY + SENDER)
              │
              ├─ canonical eth_sendRawTransaction → REJECT StorageReadNonSender
              │
              └─ alt eth_sendFrameTransaction
                    ├─ no stake → reject non-sender read
                    ├─ staked   → ADMIT → recordSpend
                    └─ over cap → VERIFY reverts OverQuota
```

---

## Do / don’t at the desk

**Do**
- Lead with the Diff panel, not the smoke Frame  
- Say “same intent, two mempools”  
- Mention foreign storage in VERIFY as the EF hook  

**Don’t**
- Claim we wrote a new Frame codec  
- Promise mainnet / MetaMask / USDC gas  
- Dig into half-hour git drama — show live Diff or explorer  

---

## Links

- Talk track: `DEMO_TALK_TRACK.md`  
- Submit form: `SUBMISSION.md`  
- Schedule: `FRAMECAP_BUILD_SCHEDULE.md`  
