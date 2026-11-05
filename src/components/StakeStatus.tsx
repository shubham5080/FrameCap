"use client";

import { useState } from "react";
import { config } from "@/lib/config";

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
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(
        `/api/stake?address=${encodeURIComponent(address.trim())}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as StakeResult;
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
          disabled={busy || address.trim().length < 42}
          onClick={() => void lookup()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Reading…" : "Check stake"}
        </button>
      </div>

      {result && (
        <div className="mt-4 space-y-1 text-sm">
          {!result.ok ? (
            <p className="text-red-400">{result.message ?? "Lookup failed"}</p>
          ) : (
            <>
              <p
                className={
                  result.isStaked ? "text-emerald-400" : "text-amber-400"
                }
              >
                {result.isStaked
                  ? "Staked (meets min stake, not withdrawing)"
                  : "Not staked / below min / withdrawing"}
              </p>
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
