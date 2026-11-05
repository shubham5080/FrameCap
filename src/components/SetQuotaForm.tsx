"use client";

import { useState } from "react";

/** Local demo control — Diff demo reads this limit when you run it. */
export function SetQuotaForm({
  limitGwei,
  onChange,
}: {
  limitGwei: string;
  onChange: (gwei: string) => void;
}) {
  const [draft, setDraft] = useState(limitGwei);
  const parsed = Number(draft);
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
      <h2 className="mb-2 text-sm font-medium text-zinc-300">Set daily quota</h2>
      <p className="mb-4 text-sm text-zinc-500">
        Limit applied onchain to the QuotaWallet before the Diff demo runs
        (VERIFY reads this via QuotaLedger).
      </p>
      <label className="block text-xs text-zinc-500" htmlFor="quota-gwei">
        Daily limit (gwei)
      </label>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          id="quota-gwei"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-emerald-500 sm:w-36"
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => onChange(draft)}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          Apply to demo
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Active for Diff:{" "}
        <span className="font-mono text-zinc-300">{limitGwei} gwei/day</span>
      </p>
    </section>
  );
}
