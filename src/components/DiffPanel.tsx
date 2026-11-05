"use client";

import { useState } from "react";
import { humanRejection } from "@/lib/explain";

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

function VerdictRow({ label, v }: { label: string; v?: Verdict }) {
  if (!v) return null;
  const tone = v.skipped
    ? "text-zinc-500"
    : v.accepted
      ? "text-emerald-400"
      : "text-red-400";
  const human = !v.accepted && !v.skipped ? humanRejection(v.message) : null;
  const text = v.skipped
    ? `skipped — ${v.skipped}`
    : v.accepted
      ? "ADMITTED"
      : `REJECTED [${human?.rule ?? v.rule ?? "?"}]`;
  return (
    <div className="rounded-lg bg-zinc-950/70 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-zinc-400">{label}</span>
        <span className={`font-medium ${tone}`}>{text}</span>
      </div>
      {human && (
        <p className="mt-1 text-sm text-zinc-300">
          {human.title} — {human.detail}
        </p>
      )}
      {v.message && (
        <p className="mt-1 break-all font-mono text-xs text-zinc-500">
          {v.message}
        </p>
      )}
      {(v.explorerUrl || v.txHash) && (
        <a
          className="mt-2 inline-block text-xs text-emerald-400 underline-offset-2 hover:underline"
          href={
            v.explorerUrl ??
            `https://explorer.altmempool.wtf/tx/${v.txHash}`
          }
          target="_blank"
          rel="noreferrer"
        >
          Explorer proof →
        </a>
      )}
    </div>
  );
}

export function DiffPanel({ dailyLimitGwei = "5" }: { dailyLimitGwei?: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DiffResult | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/diff-demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dailyLimitGwei: Number(dailyLimitGwei) }),
      });
      const data = (await res.json()) as DiffResult;
      setResult(data);
    } catch (e) {
      setResult({
        ok: false,
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-2 text-sm font-medium text-zinc-300">
        Canonical vs alt Diff
      </h2>
      <p className="mb-4 text-sm text-zinc-500">
        Deploy QuotaLedger + QuotaWallet, set the quota from the form above
        ({dailyLimitGwei} gwei/day), then show canonical reject vs alt admit and
        over-quota block.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy
          ? "Running full spine… (deploy + stake can take several minutes)"
          : "Run Diff demo"}
      </button>

      {result && (
        <div className="mt-4 space-y-3 text-sm">
          {!result.ok && (
            <p className="text-red-400">{result.message ?? "Demo failed"}</p>
          )}
          {result.ok && (
            <>
              <p className="text-zinc-400">
                Wallet{" "}
                <span className="font-mono text-zinc-200">{result.wallet}</span>
              </p>
              <p className="text-zinc-400">
                Ledger{" "}
                <span className="font-mono text-zinc-200">{result.ledger}</span>
                {" · "}limit {result.dailyLimitWei} wei/day
              </p>
              <div className="space-y-2">
                <VerdictRow
                  label="1. Canonical mempool"
                  v={result.canonical}
                />
                <VerdictRow
                  label="2. Alt mempool (pre-stake)"
                  v={result.altBeforeStake}
                />
                <VerdictRow
                  label="3. Alt after stake + record spend"
                  v={result.altAfterStake}
                />
                <VerdictRow
                  label="4. Over-quota (VERIFY reverts)"
                  v={result.overQuota}
                />
              </div>
              {result.stakeTxHash && (
                <p className="font-mono text-xs text-zinc-500">
                  stake tx {result.stakeTxHash} · stake {result.stakeAmountWei}{" "}
                  wei
                </p>
              )}

              {result.rpcEvidence && result.rpcEvidence.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-zinc-300">
                    Raw RPC evidence
                  </h3>
                  <p className="text-xs text-zinc-500">
                    JSON-RPC methods used for each Diff step (gateway{" "}
                    <span className="font-mono">/rpc</span>).
                  </p>
                  <ul className="space-y-2">
                    {result.rpcEvidence.map((e) => (
                      <li
                        key={e.step}
                        className="rounded-lg bg-zinc-950/80 p-3 font-mono text-xs"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-zinc-400">{e.step}</span>
                          <span
                            className={
                              e.ok ? "text-emerald-400" : "text-red-400"
                            }
                          >
                            {e.ok ? "ok" : "error"}
                          </span>
                        </div>
                        <p className="mt-1 text-emerald-400/90">{e.method}</p>
                        <p className="mt-0.5 text-zinc-500">{e.paramsNote}</p>
                        <p className="mt-2 break-all text-zinc-300">
                          {e.result}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
