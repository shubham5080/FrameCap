# FrameCap

Daily spend quotas enforced in **EIP-8141 Frame** validation — rejected by the **canonical public mempool**, admitted by the **staked alternative mempool**.

Built for ETHGlobal Mumbai 2026 · Ethereum Foundation — Best use of the Frame Transaction Alternative Mempool.

## Demo spine
1. Set a daily quota onchain  
2. Submit the same Frame intent to the canonical path → reject  
3. Stake the quota entity → alt mempool admits → explorer proof  
4. Over-quota attempt is blocked  

## Stack
- Next.js · TypeScript · Tailwind  
- viem · `@forshtat/hegota-support`  
- Solidity / Foundry (contracts)  
- Workshop alt-mempool gateway (chain 1337)

## Run locally
```bash
npm install
npm run dev          # http://127.0.0.1:43127
npm run smoke:first-tx   # faucet + VERIFY+SENDER Frame tx on live gateway
```

## Network
See `src/lib/config.ts` (pinned from the live workshop gateway).

## First admitted Frame tx (live)
- Hash: `0x48f225e43d5a969285a27b0b13e8aeebef4c0ff7393d5b870191f539373a9bb6`
- Block: `404046` · 2 frames succeeded
- Explorer: https://explorer.altmempool.wtf/tx/0x48f225e43d5a969285a27b0b13e8aeebef4c0ff7393d5b870191f539373a9bb6

## Diff demo (canonical ❌ / alt ✅ / over-quota ❌)
`POST /api/diff-demo` (or the **Run Diff demo** button) deploys `QuotaLedger` + `QuotaWallet`, sets a daily limit, then:

| Step | Result |
|------|--------|
| Canonical `eth_sendRawTransaction` | **REJECTED** `StorageReadNonSender` |
| Alt `eth_sendFrameTransaction` | **ADMITTED** (foreign quota read) |
| Stake wallet on registry | mined |
| Alt spend + `recordSpend` | **ADMITTED** + explorer proof |
| Over-quota VERIFY | **REJECTED** `OverQuota` |

Example post-stake proof: https://explorer.altmempool.wtf/tx/0xedb83a3de6bfd8c16202d03f64af7094d5fe1b1d6662630861c8695352233daa

```bash
npm run smoke:diff   # requires dev server on :43127
```

## Dry run checklist (before mentors / video)

Do this **twice** on a healthy gateway. Keep the tab open — Diff can take 1–3 minutes.

1. `npm run dev` → open http://127.0.0.1:43127  
2. **Gateway** → Refresh → status `reachable`, faucet `enabled`, chain `1337`  
3. **Set daily quota** → e.g. `5` gwei → Apply to demo  
4. **Run Diff demo** → wait for “Diff complete”  
5. Confirm UI rows:
   - Canonical → `REJECTED [STO]` / `StorageReadNonSender`
   - Alt pre-stake → admitted or rejected (note the raw RPC line)
   - Alt after stake → `ADMITTED` + explorer link
   - Over-quota → `REJECTED [QUOTA]`
6. Open **Raw RPC evidence** → each step shows method (`eth_sendRawTransaction` / `eth_sendFrameTransaction`) + result/error  
7. Copy wallet address → **Stake status** → Check stake → expect staked after a successful Diff  
8. Save one explorer URL for the talk track / submission form  

**Pass criteria:** same intent, canonical reject + alt admit proof + over-quota block, with RPC evidence visible.

**If Diff fails:** note the StatusLine error + HTTP/RPC message, retry once, then check faucet rate limits / gateway `skandha_explorer_info`.

## Contracts
```bash
cd contracts && forge install && forge test
```
Artifacts used by the app live in `contracts/artifacts/`.

## Repo
https://github.com/shubham5080/FrameCap

## Build schedule
Half-hour commits: [FRAMECAP_BUILD_SCHEDULE.md](./FRAMECAP_BUILD_SCHEDULE.md)

## Mentor desk
Quick Q&A + show path: [MENTOR_NOTES.md](./MENTOR_NOTES.md)

## Submission
ETHGlobal form checklist: [SUBMISSION.md](./SUBMISSION.md)

## AI disclosure
See [AI_USAGE.md](./AI_USAGE.md).
