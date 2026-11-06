# FrameCap — talk track (mentors / video / judges)

**Repo:** https://github.com/shubham5080/FrameCap  
**App:** http://127.0.0.1:43127 → **Enter FrameCap** → `/app`  
**Prize line:** EF — Best use of the Frame Transaction Alternative Mempool

---

## 90-second version

1. **Problem (15s)**  
   Daily spend quotas need Frame `VERIFY` to read a shared ledger. The canonical public mempool bans that foreign storage read (`StorageReadNonSender`).

2. **Product (15s)**  
   FrameCap: onchain daily limit on `QuotaLedger` + EIP-8141 wallet. Same signed intent, two mempools.

3. **Live (45s)**  
   Open Diff → **Run Diff (prize demo)** → point at:  
   canonical ❌ → stake → alt ✅ + explorer → over-quota ❌.  
   Open **Raw RPC evidence** for one second (`eth_sendRawTransaction` vs `eth_sendFrameTransaction`).

4. **Why EF (15s)**  
   Only the Frame Transaction Alternative Mempool makes this flexible validation practical while still enforcing the cap.

---

## Click path (rehearse once)

1. Alt mempool gateway shows **reachable** / faucet **enabled**  
2. Daily quota (e.g. 0.001 ETH) → **Save limit**  
3. **Run Diff (prize demo)** (wait 1–3 min — narrate while it runs)  
4. Scroll verdicts + Raw RPC evidence  
5. Optional: paste wallet → **Check stake**  
6. Open one explorer link  

If Diff is still running at 60s: keep talking problem/product; when it finishes, hit the four rows fast.

---

## Backup if live gateway is slow

- First Frame tx: https://explorer.altmempool.wtf/tx/0x48f225e43d5a969285a27b0b13e8aeebef4c0ff7393d5b870191f539373a9bb6  
- Post-stake Diff proof: https://explorer.altmempool.wtf/tx/0xedb83a3de6bfd8c16202d03f64af7094d5fe1b1d6662630861c8695352233daa  

Say: “Same spine we just ran; here’s a mined explorer proof.”

---

## Do say / don’t say

**Do say**
- Same Frame intent, two admission policies  
- Foreign storage in VERIFY is the differentiator  
- Over-quota still blocks after alt admit  
- We use `@forshtat/hegota-support` + workshop gateway  

**Don’t say**
- We rebuilt the Frame codec  
- We need USDC gas / MetaMask mainnet  
- This is a Frame IDE / general debugger  
- Classic “we slept on the commit history” excuses — show the live Diff  

---

## 30s mentor desk

“FrameCap: daily quota in Frame VERIFY. Canonical rejects foreign ledger read; staked alt admits; over-quota still fails. Want the Diff panel or the explorer link?”
