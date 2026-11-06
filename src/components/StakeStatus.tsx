"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { StatusLine } from "@/components/StatusLine";
import {
  Badge,
  Field,
  GhostButton,
  Panel,
  PanelHint,
  PanelTitle,
  PrimaryButton,
} from "@/components/ui";

type StakeResult = {
  ok: boolean;
  address?: string;
  registry?: string;
  amountWei?: string;
  amountEth?: string;
  unstakeDelaySec?: number;
  withdrawTime?: number;
  isStaked?: boolean;
  message?: string;
};

export function StakeStatus() {
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StakeResult | null>(null);

  async function lookup() {
    const trimmed = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setResult({
        ok: false,
        message: "Enter a 42-character 0x address before checking stake.",
      });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/stake?address=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" },
      );
      let data: StakeResult;
      try {
        data = (await res.json()) as StakeResult;
      } catch {
        setResult({
          ok: false,
          message: `Bad JSON from /api/stake (HTTP ${res.status})`,
        });
        return;
      }
      if (!res.ok && data.ok !== false) {
        data = {
          ok: false,
          message: data.message ?? `HTTP ${res.status}`,
        };
      }
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
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <PanelTitle>Stake on NaiveStakingRegistry</PanelTitle>
          <PanelHint>
            Paste the wallet Diff prints after step 3. Alt admission needs ≥0.01 ETH
            staked here.
          </PanelHint>
        </div>
        {result?.ok && (
          <Badge tone={result.isStaked ? "ok" : "bad"}>
            {result.isStaked ? "Eligible" : "Not eligible"}
          </Badge>
        )}
      </div>

      <p className="mt-3 break-anywhere font-mono text-[11px] text-morpho-muted">
        {config.stakingRegistry}
      </p>

      <label
        className="mt-5 mb-1.5 block text-xs font-medium text-morpho-muted"
        htmlFor="stake-addr"
      >
        QuotaWallet address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="stake-addr"
          type="text"
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono"
        />
        <PrimaryButton
          type="button"
          disabled={busy}
          onClick={() => void lookup()}
          className="w-full shrink-0 sm:w-auto"
        >
          {busy ? "Checking…" : "Check stake"}
        </PrimaryButton>
      </div>

      {busy && (
        <div className="mt-4">
          <StatusLine kind="loading">
            Reading getDepositInfo on the registry…
          </StatusLine>
        </div>
      )}

      {!busy && !result && (
        <div className="mt-4">
          <StatusLine kind="idle">
            Waiting for a wallet address from Diff.
          </StatusLine>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-2 border-t border-morpho-line pt-4 text-sm">
          {!result.ok ? (
            <div className="space-y-1">
              <StatusLine kind="error">Lookup failed</StatusLine>
              <p className="break-all font-mono text-xs text-morpho-red/80">
                {result.message}
              </p>
            </div>
          ) : (
            <>
              <StatusLine kind={result.isStaked ? "ok" : "error"}>
                {result.isStaked
                  ? "Staked — eligible for alt mempool rules"
                  : "Not eligible — below min stake or withdrawing"}
              </StatusLine>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-morpho-bg px-3.5 py-3">
                  <p className="text-xs text-morpho-muted">Amount</p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-morpho-ink">
                    {result.amountEth} ETH
                  </p>
                </div>
                <div className="rounded-xl bg-morpho-bg px-3.5 py-3">
                  <p className="text-xs text-morpho-muted">Unstake delay</p>
                  <p className="mt-0.5 font-mono text-sm font-medium text-morpho-ink">
                    {result.unstakeDelaySec}s
                  </p>
                </div>
              </div>
              <GhostButton type="button" onClick={() => void lookup()}>
                Refresh stake
              </GhostButton>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
