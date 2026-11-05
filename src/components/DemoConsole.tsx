"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusLine } from "@/components/StatusLine";

type Health = {
  ok: boolean;
  chainId: number;
  clientVersion: string | null;
  faucetEnabled: boolean;
  explorer: Record<string, unknown> | null;
  error?: string;
  config?: {
    gatewayUrl: string;
    explorerUrl: string;
    profileId: string;
    stakingRegistry: string;
  };
};

type FirstTx = {
  ok: boolean;
  address?: string;
  funded?: boolean;
  faucetTxHash?: string | null;
  txHash?: string;
  explorerUrl?: string;
  balanceWei?: string;
  blockNumber?: number | null;
  framesOk?: number;
  message?: string;
  code?: string | number;
};

export function DemoConsole() {
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<FirstTx | null>(null);

  const [healthLoading, setHealthLoading] = useState(true);

  const refreshHealth = useCallback(async () => {
    setHealthErr(null);
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) {
        setHealth(null);
        setHealthErr(`Health HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as Health;
      setHealth(data);
    } catch (e) {
      setHealth(null);
      setHealthErr(e instanceof Error ? e.message : String(e));
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  async function runFirstTx() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/first-tx", { method: "POST" });
      let data: FirstTx;
      try {
        data = (await res.json()) as FirstTx;
      } catch {
        setResult({
          ok: false,
          message: `Bad JSON from /api/first-tx (HTTP ${res.status})`,
          code: res.status,
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
      void refreshHealth();
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
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-300">Gateway</h2>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            className="text-xs text-emerald-400 hover:underline"
          >
            Refresh
          </button>
        </div>
        {healthLoading && (
          <StatusLine kind="loading">Probing gateway…</StatusLine>
        )}
        {healthErr && !healthLoading && (
          <div className="space-y-1">
            <StatusLine kind="error">Health check failed</StatusLine>
            <p className="font-mono text-xs text-red-400/80">{healthErr}</p>
            <button
              type="button"
              onClick={() => void refreshHealth()}
              className="text-xs text-emerald-400 hover:underline"
            >
              Retry health
            </button>
          </div>
        )}
        {health && !healthLoading && (
          <dl className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Status</dt>
              <dd className={health.ok ? "text-emerald-400" : "text-red-400"}>
                {health.ok ? "reachable" : "unreachable"}
                {health.error ? ` — ${health.error}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Chain ID</dt>
              <dd className="text-zinc-200">{health.chainId || "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Faucet</dt>
              <dd className="text-zinc-200">
                {health.faucetEnabled ? "enabled" : "disabled / unknown"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Client</dt>
              <dd className="truncate text-zinc-200">
                {health.clientVersion ?? "—"}
              </dd>
            </div>
            {health.explorer && (
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">Explorer info</dt>
                <dd className="mt-1 overflow-x-auto rounded-lg bg-zinc-950/80 p-3 font-mono text-xs text-zinc-400">
                  {JSON.stringify(health.explorer)}
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-2 text-sm font-medium text-zinc-300">
          First admitted Frame tx
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Generate a key, ask the faucet if needed, sign a VERIFY+SENDER
          self-relay, submit via eth_sendFrameTransaction, wait for inclusion.
        </p>
        {health?.ok === false && (
          <StatusLine kind="error">
            Gateway unreachable — fix health before sending a Frame tx.
          </StatusLine>
        )}
        <button
          type="button"
          disabled={busy || health?.ok === false || healthLoading}
          onClick={() => void runFirstTx()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Sending…" : "Send first Frame tx"}
        </button>
        {busy && (
          <div className="mt-3">
            <StatusLine kind="loading">
              Faucet (if needed) → sign → eth_sendFrameTransaction → wait mine
              (~1–2 min)
            </StatusLine>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-2 text-sm">
            {result.ok ? (
              <>
                <StatusLine kind="ok">Admitted and mined.</StatusLine>
                <p className="text-zinc-400">
                  Sender{" "}
                  <span className="font-mono text-zinc-200">{result.address}</span>
                </p>
                <p className="text-zinc-400">
                  Tx{" "}
                  <span className="font-mono text-zinc-200">{result.txHash}</span>
                </p>
                {result.blockNumber != null && (
                  <p className="text-zinc-400">
                    Block {result.blockNumber} · frames ok {result.framesOk}
                    {result.funded ? " · faucet used" : ""}
                  </p>
                )}
                {result.explorerUrl && (
                  <a
                    className="inline-block text-emerald-400 underline-offset-2 hover:underline"
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in explorer →
                  </a>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <StatusLine kind="error">
                  Failed{result.code != null ? ` (${result.code})` : ""}
                </StatusLine>
                <p className="break-all font-mono text-xs text-red-400/80">
                  {result.message}
                </p>
                <button
                  type="button"
                  disabled={busy || health?.ok === false}
                  onClick={() => void runFirstTx()}
                  className="text-xs text-emerald-400 hover:underline disabled:opacity-40"
                >
                  Retry first Frame tx
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
