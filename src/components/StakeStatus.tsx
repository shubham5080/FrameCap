"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { StatusLine } from "@/components/StatusLine";

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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-2 text-sm font-medium text-zinc-300">Stake status</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Read NaiveStakingRegistry for a wallet (paste address from Diff demo
        after stake). Registry{" "}
        <span className="font-mono text-zinc-400">{config.stakingRegistry}</span>
      </p>
      <label className="block text-xs text-zinc-500" htmlFor="stake-addr">
        Wallet address
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <input
          id="stake-addr"
          type="text"
          placeholder="0x…"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="min-w-[16rem] flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void lookup()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Reading…" : "Check stake"}
        </button>
      </div>

      {busy && (
        <div className="mt-3">
          <StatusLine kind="loading">
            eth_call getDepositInfo on staking registry…
          </StatusLine>
        </div>
      )}

      {!busy && !result && (
        <div className="mt-3">
          <StatusLine kind="idle">
            Paste a wallet from Diff demo to see stake.
          </StatusLine>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-1 text-sm">
          {!result.ok ? (
            <div className="space-y-1">
              <StatusLine kind="error">Lookup failed</StatusLine>
              <p className="break-all font-mono text-xs text-red-400/80">
                {result.message}
              </p>
            </div>
          ) : (
            <>
              <StatusLine kind={result.isStaked ? "ok" : "error"}>
                {result.isStaked
                  ? "Staked (meets min stake, not withdrawing)"
                  : "Not staked / below min / withdrawing"}
              </StatusLine>
              <p className="text-zinc-400">
                Amount{" "}
                <span className="font-mono text-zinc-200">
                  {result.amountEth} ETH
                </span>{" "}
                ({result.amountWei} wei)
              </p>
              <p className="text-zinc-500">
                unstakeDelay {result.unstakeDelaySec}s · withdrawTime{" "}
                {result.withdrawTime}
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
