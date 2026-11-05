# FrameCap — NO-SLEEP Grind Schedule

**Product:** FrameCap (renamed from QuotaGuard — fresh repo, clean cadence)  
**Build:** Thu 5 Nov **22:15 IST** → Sat 7 Nov **03:00 IST**  
**Video:** Sat **03:00–06:00**  
**Submit:** before Sat **09:00** (target **08:00**)  
**Repo:** https://github.com/shubham5080/FrameCap (`main`)  
**Rule:** **one half-hour slot = one commit = push = stop**

---

## Marks

| Mark | Meaning |
|------|---------|
| ✅ | Slot done as its own commit + pushed to FrameCap |
| ⬜ | Not done |

---

## GitHub pushes (FrameCap only)

| ✅ | IST | SHA | Commit |
|----|-----|-----|--------|
| ✅ | 22:15 | `861e267` | `chore: scaffold FrameCap` |
| ✅ | 22:17 | `2a6580c` | `docs: fix scaffold SHA on FrameCap schedule` |
| ✅ | 23:01 | `43eb862` | `feat: stake status ui` |
| ✅ | 23:10 | `ab78395` | `docs: tick stake status on FrameCap schedule` |
| ✅ | 23:33 | `b29d02c` | `feat: raw rpc evidence` (origin; push GitHub if missing) |
| ✅ | 00:26 | `a4bd5ef` | `fix: loading error states` |
| ✅ | 00:49 | `fa8cdee` | `style: responsive basics` |
| ✅ | 00:54 | `a95fc25` | `docs: dry run evidence` |
| ✅ | 01:13 | `46d203a` | `docs: demo talk track` |
| ✅ | 01:44 | `1be9e5b` | `docs: submission checklist` |
| ✅ | 02:23 | `5d84ccf` | `fix: demo copy` |
| ✅ | 02:47 | `3cc2929` | `docs: mentor notes` |
| ✅ | 03:13 | `f694290` | `docs: sync ui labels` |
| ⬜ | 04:58 | _(you push)_ | catch-up: gateway → diff recovery → evidence |

---

## Thu 22:15 → Fri 03:00 — Cadence restart

| Slot | Time | Task | Commit |
|------|------|------|--------|
| ✅ | 22:15 | Rename + fresh repo scaffold push | `chore: scaffold FrameCap` |
| ✅ | 22:45 | Stake status in UI | `feat: stake status ui` |
| ✅ | 23:15 | Raw RPC evidence in Diff | `feat: raw rpc evidence` |
| ✅ | 23:45 | Loading/error states | `fix: loading error states` |
| ✅ | 00:15 | Mobile usable layout | `style: responsive basics` |
| ✅ | 00:45 | Diff dry run notes in README | `docs: dry run evidence` |
| ✅ | 01:15 | Demo talk track polish | `docs: demo talk track` |
| ✅ | 01:45 | AI_USAGE / submission checklist | `docs: submission checklist` |
| ✅ | 02:15 | Tiny UX copy fixes | `fix: demo copy` |
| ✅ | 02:45 | Buffer / mentor notes | `docs: mentor notes` |

---

## Fri 03:00 → 15:00 — Harden only (still 30‑min commits)

| Slot | Time | Task | Commit |
|------|------|------|--------|
| ✅ | 03:00 | Sync README / talk track to UI labels | `docs: sync ui labels` |
| ✅ | 03:30 | Gateway health harden notes | `docs: gateway harden` |
| ✅ | 04:00 | Diff failure recovery notes | `docs: diff recovery` (catch-up) |
| ⬜ | 04:30 | Screenshot / evidence folder stub | `docs: evidence stub` |
| ⬜ | 05:00+ | Rehearse + fix only as needed | keep half-hour commits |
| ⬜ | 15:00 | **FEATURE FREEZE** | `chore: feature freeze` |

---

## Sat 03:00 → 09:00

| Slot | Time | Task |
|------|------|------|
| ⬜ | 03:00–06:00 | Record video |
| ⬜ | 06:00–08:00 | ETHGlobal form + submit |
| ⬜ | 08:00–09:00 | Buffer |

---

## Demo spine (unchanged)

set quota → canonical ❌ → stake → alt ✅ → explorer → over-quota ❌

## Rules

1. One slot → one commit → push FrameCap → **stop**  
2. Do not bundle multiple slots  
3. Do not push to old QuotaGuard repo  
4. Revoke GitHub PAT after submit  
