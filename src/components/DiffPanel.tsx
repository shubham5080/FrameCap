"use client";

import { useState } from "react";
import { humanRejection } from "@/lib/explain";
import { StatusLine } from "@/components/StatusLine";
import {
  Badge,
  GhostButton,
  Panel,
  PanelHint,
  PanelTitle,
  PrimaryButton,
} from "@/components/ui";

type Verdict = {
  accepted: boolean;
  message?: string;
  rule?: string;
  skipped?: string;
  txHash?: string;
  explorerUrl?: string;
};

type RpcEvidence = {
  step: string;
  method: string;
  paramsNote: string;
  ok: boolean;
  result: string;
};

type DiffResult = {
  ok: boolean;
  message?: string;
  code?: string | number;
  owner?: string;
  ledger?: string;
  wallet?: string;
  dailyLimitWei?: string;
  canonical?: Verdict;
  altBeforeStake?: Verdict;
  stakeTxHash?: string;
  stakeAmountWei?: string;
  altAfterStake?: Verdict;
  overQuota?: Verdict;
  rpcEvidence?: RpcEvidence[];
};

const PHASES = [
  "Deploy QuotaLedger + QuotaWallet…",
  "Write daily quota onchain…",
  "Canonical mempool probe…",
  "Alt mempool (pre-stake)…",
  "Stake on NaiveStakingRegistry…",
  "Alt admit + record spend…",
  "Over-quota VERIFY check…",
] as const;

function VerdictRow({
  step,
  label,
  expect,
  v,
}: {
  step: string;
  label: string;
  expect: string;
  v?: Verdict;
}) {
  if (!v) return null;
  const tone = v.skipped
    ? "idle"
    : v.accepted
      ? "ok"
      : "bad";
  const human = !v.accepted && !v.skipped ? humanRejection(v.message) : null;
  const text = v.skipped
    ? `skipped — ${v.skipped}`
    : v.accepted
      ? "ADMITTED"
      : `REJECTED [${human?.rule ?? v.rule ?? "?"}]`;

  return (
    <tr className="border-t border-morpho-line bg-white">
      <td className="whitespace-nowrap px-3.5 py-3 align-top font-mono text-xs text-morpho-muted">
        {step}
      </td>
      <td className="px-3.5 py-3 align-top">
        <p className="text-sm font-medium text-morpho-ink">{label}</p>
        <p className="mt-0.5 text-xs text-morpho-muted">{expect}</p>
        {human && (
          <p className="mt-1.5 text-xs text-morpho-ink/80">
            {human.title} — {human.detail}
          </p>
        )}
        {v.message && (
          <p className="mt-1 max-w-xl break-all font-mono text-[11px] text-morpho-muted">
            {v.message}
          </p>
        )}
        {(v.explorerUrl || v.txHash) && (
          <a
            className="mt-2 inline-flex text-xs font-medium text-morpho-blue hover:underline"
            href={
              v.explorerUrl ??
              `https://explorer.altmempool.wtf/tx/${v.txHash}`
            }
            target="_blank"
            rel="noreferrer"
          >
            Open explorer proof →
          </a>
        )}
      </td>
      <td className="px-3.5 py-3 align-top text-right">
        <Badge tone={tone}>{text}</Badge>
      </td>
    </tr>
  );
}

export function DiffPanel({ dailyLimitGwei = "5" }: { dailyLimitGwei?: string }) {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<DiffResult | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    setPhase(0);
    const tick = window.setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 4000);
    try {
      const res = await fetch("/api/diff-demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dailyLimitGwei: Number(dailyLimitGwei) }),
      });
      let data: DiffResult;
      try {
        data = (await res.json()) as DiffResult;
      } catch {
        setResult({
          ok: false,
          message: `Bad JSON from /api/diff-demo (HTTP ${res.status})`,
        });
        return;
      }
      if (!res.ok && data.ok !== false) {
        data = {
          ok: false,
          message: data.message ?? `HTTP ${res.status}`,
          code: data.code ?? res.status,
        };
      }
      setResult(data);
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      window.clearInterval(tick);
      setBusy(false);
    }
  }

  return (
    <Panel className="fc-enter fc-enter-delay-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <PanelTitle>Diff: canonical reject vs alt admit</PanelTitle>
          <PanelHint>
            Full prize spine at {dailyLimitGwei} gwei/day — deploy, quota,
            canonical reject, stake, alt admit, then over-quota block.
          </PanelHint>
        </div>
        <PrimaryButton
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="w-full shrink-0 sm:w-auto"
        >
          {busy ? "Running Diff…" : "Run Diff (prize demo)"}
        </PrimaryButton>
      </div>

      {busy && (
        <div className="mt-5 space-y-1 rounded-xl border border-morpho-line bg-morpho-bg px-4 py-3">
          <StatusLine kind="loading">{PHASES[phase]}</StatusLine>
          <p className="text-xs text-morpho-muted">
            Live gateway deploy + mine — typically 1–3 minutes.
          </p>
        </div>
      )}

      {!busy && !result && (
        <div className="mt-5">
          <StatusLine kind="idle">
            Ready — start Diff when gateway health is green.
          </StatusLine>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          {!result.ok ? (
            <div className="space-y-2 rounded-xl border border-morpho-red/20 bg-morpho-redSoft px-4 py-3">
              <StatusLine kind="error">
                Diff failed
                {result.code != null ? ` (${result.code})` : ""}
              </StatusLine>
              <p className="break-all font-mono text-xs text-morpho-red/80">
                {result.message ?? "Unknown error"}
              </p>
              <GhostButton type="button" onClick={() => void run()}>
                Retry Diff
              </GhostButton>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="ok">Complete</Badge>
                <StatusLine kind="ok">
                  Canonical vs alt spine recorded.
                </StatusLine>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-morpho-line bg-morpho-bg px-3.5 py-3">
                  <p className="text-xs text-morpho-muted">Wallet</p>
                  <p className="mt-0.5 break-anywhere font-mono text-xs text-morpho-ink">
                    {result.wallet}
                  </p>
                </div>
                <div className="rounded-xl border border-morpho-line bg-morpho-bg px-3.5 py-3">
                  <p className="text-xs text-morpho-muted">Ledger · limit</p>
                  <p className="mt-0.5 break-anywhere font-mono text-xs text-morpho-ink">
                    {result.ledger}
                  </p>
                  <p className="mt-1 font-mono text-xs text-morpho-muted">
                    {result.dailyLimitWei} wei/day
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-morpho-line">
                <table className="w-full text-left">
                  <thead className="bg-morpho-bg text-xs font-medium uppercase tracking-wide text-morpho-muted">
                    <tr>
                      <th className="px-3.5 py-2.5">Step</th>
                      <th className="px-3.5 py-2.5">Market path</th>
                      <th className="px-3.5 py-2.5 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <VerdictRow
                      step="01"
                      label="Canonical mempool"
                      expect="Expect reject"
                      v={result.canonical}
                    />
                    <VerdictRow
                      step="02"
                      label="Alt before stake"
                      expect="Expect reject"
                      v={result.altBeforeStake}
                    />
                    <VerdictRow
                      step="03"
                      label="Alt after stake"
                      expect="Expect admit"
                      v={result.altAfterStake}
                    />
                    <VerdictRow
                      step="04"
                      label="Over quota"
                      expect="VERIFY reverts"
                      v={result.overQuota}
                    />
                  </tbody>
                </table>
              </div>

              {result.stakeTxHash && (
                <p className="font-mono text-xs text-morpho-muted">
                  stake {result.stakeTxHash} · {result.stakeAmountWei} wei
                </p>
              )}

              {result.rpcEvidence && result.rpcEvidence.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-morpho-ink">
                      Raw RPC evidence
                    </h3>
                    <p className="mt-1 text-xs text-morpho-muted">
                      Methods hit on the workshop gateway for each Diff step.
                    </p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-morpho-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-morpho-bg text-[11px] font-medium uppercase tracking-wide text-morpho-muted">
                        <tr>
                          <th className="px-3.5 py-2.5">Step</th>
                          <th className="px-3.5 py-2.5">Method</th>
                          <th className="px-3.5 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-morpho-line">
                        {result.rpcEvidence.map((e) => (
                          <tr key={e.step} className="bg-white">
                            <td className="px-3.5 py-3 align-top">
                              <p className="font-medium text-morpho-ink">
                                {e.step}
                              </p>
                              <p className="mt-1 text-morpho-muted">
                                {e.paramsNote}
                              </p>
                              <p className="mt-1 break-anywhere font-mono text-[11px] text-morpho-muted">
                                {e.result}
                              </p>
                            </td>
                            <td className="px-3.5 py-3 align-top font-mono text-morpho-blue">
                              {e.method}
                            </td>
                            <td className="px-3.5 py-3 align-top text-right">
                              <Badge tone={e.ok ? "ok" : "bad"}>
                                {e.ok ? "ok" : "error"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
