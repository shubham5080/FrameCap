"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusLine } from "@/components/StatusLine";
import {
  Badge,
  GhostButton,
  Panel,
  PanelHint,
  PanelTitle,
  PrimaryButton,
} from "@/components/ui";

type Health = {
  ok: boolean;
  chainId: number;
  clientVersion: string | null;
  faucetEnabled: boolean;
  explorer: Record<string, unknown> | null;
  error?: string;
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
        setHealthErr(`Health check failed (HTTP ${res.status})`);
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
          message: `Bad response from test send (HTTP ${res.status})`,
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
    <div className="space-y-4">
      <Panel>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <PanelTitle>Is the network online?</PanelTitle>
            <PanelHint>
              Green means you can run the comparison. If it’s red, wait a moment
              and tap Recheck.
            </PanelHint>
          </div>
          <div className="flex items-center gap-2">
            {!healthLoading && health && (
              <Badge tone={health.ok ? "ok" : "bad"}>
                {health.ok ? "Online" : "Offline"}
              </Badge>
            )}
            <GhostButton type="button" onClick={() => void refreshHealth()}>
              Recheck
            </GhostButton>
          </div>
        </div>

        {healthLoading && (
          <StatusLine kind="loading">Checking network…</StatusLine>
        )}
        {healthErr && !healthLoading && (
          <div className="space-y-1">
            <StatusLine kind="error">Network check failed</StatusLine>
            <p className="font-mono text-xs text-morpho-red/80">{healthErr}</p>
            <GhostButton type="button" onClick={() => void refreshHealth()}>
              Try again
            </GhostButton>
          </div>
        )}
        {health && !healthLoading && (
          <div className="overflow-hidden rounded-xl border border-morpho-line">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-morpho-line">
                <tr className="bg-white">
                  <th className="px-3.5 py-2.5 text-xs font-medium text-morpho-muted">
                    Status
                  </th>
                  <td
                    className={`px-3.5 py-2.5 font-medium ${
                      health.ok ? "text-morpho-green" : "text-morpho-red"
                    }`}
                  >
                    {health.ok ? "Online" : "Offline"}
                    {health.error ? ` — ${health.error}` : ""}
                  </td>
                </tr>
                <tr>
                  <th className="px-3.5 py-2.5 text-xs font-medium text-morpho-muted">
                    Test chain
                  </th>
                  <td className="px-3.5 py-2.5 font-mono text-morpho-ink">
                    {health.chainId || "—"}
                  </td>
                </tr>
                <tr>
                  <th className="px-3.5 py-2.5 text-xs font-medium text-morpho-muted">
                    Free test funds
                  </th>
                  <td className="px-3.5 py-2.5 text-morpho-ink">
                    {health.faucetEnabled ? "Available" : "Unavailable"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-muted">
          Optional
        </p>
        <PanelTitle>Send a quick test transaction</PanelTitle>
        <PanelHint>
          Skip this for the main demo. Use it only if you want a simple “network
          works” check before the full comparison.
        </PanelHint>

        {health?.ok === false && (
          <div className="mt-3">
            <StatusLine kind="error">
              Network is offline — fix that before sending a test.
            </StatusLine>
          </div>
        )}

        <div className="mt-5">
          <PrimaryButton
            type="button"
            disabled={busy || health?.ok === false || healthLoading}
            onClick={() => void runFirstTx()}
            className="w-full sm:w-auto"
          >
            {busy ? "Sending…" : "Send test transaction"}
          </PrimaryButton>
        </div>

        {busy && (
          <div className="mt-3">
            <StatusLine kind="loading">
              Funding (if needed) → signing → waiting for the block (~1–2 min)
            </StatusLine>
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-2 border-t border-morpho-line pt-4 text-sm">
            {result.ok ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="ok">Success</Badge>
                  <StatusLine kind="ok">Test transaction mined.</StatusLine>
                </div>
                <p className="break-anywhere text-morpho-muted">
                  Wallet{" "}
                  <span className="font-mono text-morpho-ink">{result.address}</span>
                </p>
                {result.explorerUrl && (
                  <a
                    className="inline-flex text-sm font-medium text-morpho-blue hover:underline"
                    href={result.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on explorer →
                  </a>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <StatusLine kind="error">
                  Test failed{result.code != null ? ` (${result.code})` : ""}
                </StatusLine>
                <p className="break-all font-mono text-xs text-morpho-red/80">
                  {result.message}
                </p>
                <GhostButton
                  type="button"
                  disabled={busy || health?.ok === false}
                  onClick={() => void runFirstTx()}
                >
                  Retry test
                </GhostButton>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
