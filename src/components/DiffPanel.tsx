"use client";

import { useState } from "react";
import { humanFailure, humanRejection } from "@/lib/explain";
import {
  ethLimitForWorkshopProof,
  type QuotaTokenId,
  tokenMeta,
} from "@/lib/tokens";
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
  mode?: "live" | "recorded";
  notice?: string;
};

const PHASES = [
  "Creating the quota contracts…",
  "Writing your daily limit…",
  "Trying the public mempool…",
  "Trying the alt mempool (before stake)…",
  "Staking the wallet…",
  "Trying the alt mempool again…",
  "Trying a spend over the daily limit…",
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
  const tone = v.skipped ? "idle" : v.accepted ? "ok" : "bad";
  const human = !v.accepted && !v.skipped ? humanRejection(v.message) : null;
  const text = v.skipped
    ? `Skipped — ${v.skipped}`
    : v.accepted
      ? "Allowed"
      : "Blocked";

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
            Open proof on explorer →
          </a>
        )}
      </td>
      <td className="px-3.5 py-3 align-top text-right">
        <Badge tone={tone}>{text}</Badge>
      </td>
    </tr>
  );
}

export function DiffPanel({
  dailyLimitAmount = "0.001",
  weeklyLimitAmount = "",
  monthlyLimitAmount = "",
  token = "ETH",
}: {
  dailyLimitAmount?: string;
  weeklyLimitAmount?: string;
  monthlyLimitAmount?: string;
  token?: QuotaTokenId;
}) {
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState(0);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [showTech, setShowTech] = useState(false);
  const meta = tokenMeta(token);
  const workshopEth = ethLimitForWorkshopProof(token, dailyLimitAmount);
  const workshopWeekly = weeklyLimitAmount
    ? ethLimitForWorkshopProof(token, weeklyLimitAmount)
    : "";
  const workshopMonthly = monthlyLimitAmount
    ? ethLimitForWorkshopProof(token, monthlyLimitAmount)
    : "";

  async function run() {
    setBusy(true);
    setResult(null);
    setPhase(0);
    setShowTech(false);
    const tick = window.setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 4000);
    const ac = new AbortController();
    const kill = window.setTimeout(() => ac.abort(), 90_000);
    try {
      const res = await fetch("/api/diff-demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dailyLimitEth: workshopEth,
          weeklyLimitEth: workshopWeekly || undefined,
          monthlyLimitEth: workshopMonthly || undefined,
          token,
        }),
        signal: ac.signal,
      });
      let data: DiffResult;
      try {
        data = (await res.json()) as DiffResult;
      } catch {
        setResult({
          ok: false,
          message: `Bad response from comparison (HTTP ${res.status})`,
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
      const aborted =
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError");
      setResult({
        ok: false,
        message: aborted
          ? "Live proof took too long. Refresh and try again — if the network is slow, FrameCap will show a recorded proof."
          : e instanceof Error
            ? e.message
            : String(e),
      });
    } finally {
      window.clearTimeout(kill);
      window.clearInterval(tick);
      setBusy(false);
    }
  }

  return (
    <Panel className="fc-enter fc-enter-delay-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
        2 · Live proof
      </p>
      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <PanelTitle>Prove the spend limit on the test network</PanelTitle>
          <PanelHint>
            One button. You’ll get four clear outcomes: public path blocked, alt
            path blocked until stake, alt path allowed after stake, over-limit
            blocked. Limits:{" "}
            <span className="font-medium text-morpho-ink">
              {dailyLimitAmount} {meta.label}/day
              {weeklyLimitAmount
                ? ` · ${weeklyLimitAmount} ${meta.label}/week`
                : ""}
              {monthlyLimitAmount
                ? ` · ${monthlyLimitAmount} ${meta.label}/month`
                : ""}
            </span>
            {token !== "ETH" && (
              <>
                {" "}
                (workshop proof runs as {workshopEth} ETH daily)
              </>
            )}
            .
          </PanelHint>
        </div>
        <PrimaryButton
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="w-full shrink-0 sm:w-auto"
        >
          {busy ? "Running…" : "Run live proof"}
        </PrimaryButton>
      </div>

      {busy && (
        <div className="mt-5 space-y-1 rounded-xl border border-morpho-line bg-morpho-bg px-4 py-3">
          <StatusLine kind="loading">{PHASES[phase]}</StatusLine>
          <p className="text-xs text-morpho-muted">
            Talking to the live test network. Usually finishes within ~1 minute —
            if it stalls, FrameCap switches to a recorded proof automatically.
          </p>
        </div>
      )}

      {!busy && !result && (
        <div className="mt-5">
          <StatusLine kind="idle">
            Ready when you are — make sure Step 1 is saved and the network is online.
          </StatusLine>
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          {!result.ok ? (
            <div className="space-y-2 rounded-xl border border-morpho-red/20 bg-morpho-redSoft px-4 py-3">
              {(() => {
                const fail = humanFailure(result.message);
                return (
                  <>
                    <StatusLine kind="error">
                      {fail?.title ??
                        `Comparison failed${result.code != null ? ` (${result.code})` : ""}`}
                    </StatusLine>
                    <p className="text-sm text-morpho-ink/80">
                      {fail?.detail ??
                        "Something went wrong talking to the test network."}
                    </p>
                    <p className="break-all font-mono text-xs text-morpho-red/80">
                      {result.message ?? "Unknown error"}
                    </p>
                    <p className="text-xs text-morpho-muted">
                      Backup explorer proof:{" "}
                      <a
                        className="font-medium text-morpho-blue hover:underline"
                        href="https://explorer.altmempool.wtf/tx/0xedb83a3de6bfd8c16202d03f64af7094d5fe1b1d6662630861c8695352233daa"
                        target="_blank"
                        rel="noreferrer"
                      >
                        open mined Diff tx →
                      </a>
                    </p>
                  </>
                );
              })()}
              <GhostButton type="button" onClick={() => void run()}>
                Try again
              </GhostButton>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={result.mode === "recorded" ? "info" : "ok"}>
                  {result.mode === "recorded" ? "Recorded proof" : "Live proof"}
                </Badge>
                <StatusLine kind="ok">
                  {result.mode === "recorded"
                    ? "Recorded proof ready — read the four results below."
                    : "Comparison finished — read the four results below."}
                </StatusLine>
              </div>
              {result.notice && (
                <p className="rounded-xl bg-morpho-blueSoft px-3.5 py-3 text-sm text-morpho-ink">
                  {result.notice}
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-morpho-line bg-morpho-bg px-3.5 py-3">
                  <p className="text-xs text-morpho-muted">Demo wallet</p>
                  <p className="mt-0.5 break-anywhere font-mono text-xs text-morpho-ink">
                    {result.wallet}
                  </p>
                </div>
                <div className="rounded-xl border border-morpho-line bg-morpho-bg px-3.5 py-3">
                  <p className="text-xs text-morpho-muted">Daily limit</p>
                  <p className="mt-0.5 font-mono text-xs text-morpho-ink">
                    {dailyLimitAmount} {meta.label}/day
                    {token !== "ETH" ? ` · proof ${workshopEth} ETH` : ""}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-morpho-line">
                <table className="w-full text-left">
                  <thead className="bg-morpho-bg text-xs font-medium uppercase tracking-wide text-morpho-muted">
                    <tr>
                      <th className="px-3.5 py-2.5">#</th>
                      <th className="px-3.5 py-2.5">What we tried</th>
                      <th className="px-3.5 py-2.5 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    <VerdictRow
                      step="01"
                      label="Public mempool"
                      expect="Should block — quota storage isn’t allowed there"
                      v={result.canonical}
                    />
                    <VerdictRow
                      step="02"
                      label="Alt mempool, before stake"
                      expect={
                        result.altBeforeStake?.accepted
                          ? "Workshop profile admitted this without stake today — not a FrameCap bug"
                          : "Often blocks until the wallet is staked"
                      }
                      v={result.altBeforeStake}
                    />
                    <VerdictRow
                      step="03"
                      label="Alt mempool, after stake"
                      expect="Should allow the spend under the daily limit"
                      v={result.altAfterStake}
                    />
                    <VerdictRow
                      step="04"
                      label="Spend over the daily limit"
                      expect="Should block even on the alt mempool"
                      v={result.overQuota}
                    />
                  </tbody>
                </table>
              </div>

              {result.rpcEvidence && result.rpcEvidence.length > 0 && (
                <div>
                  <GhostButton type="button" onClick={() => setShowTech((s) => !s)}>
                    {showTech ? "Hide technical details" : "Show technical details"}
                  </GhostButton>
                  {showTech && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-morpho-muted">
                        Raw JSON-RPC calls used for each step (for judges / mentors).
                      </p>
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
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
