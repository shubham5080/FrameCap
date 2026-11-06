"use client";

import { useState } from "react";
import { Field, Panel, PanelHint, PanelTitle, PrimaryButton } from "@/components/ui";

/** Step 1 — daily spend limit in ETH. */
export function SetQuotaForm({
  limitEth,
  onChange,
}: {
  limitEth: string;
  onChange: (eth: string) => void;
}) {
  const [draft, setDraft] = useState(limitEth);
  const parsed = Number(draft);
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
        1 · Limit
      </p>
      <PanelTitle>How much can this wallet spend today?</PanelTitle>
      <PanelHint>
        Enter the daily limit in <span className="font-medium text-morpho-ink">ETH</span>.
        Use <span className="font-medium text-morpho-ink">0.001</span> if you’re
        unsure. Then run the live proof below.
      </PanelHint>
      <label
        className="mt-5 mb-1.5 block text-xs font-medium text-morpho-muted"
        htmlFor="quota-eth"
      >
        Limit (ETH per day)
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="quota-eth"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="sm:w-44"
        />
        <PrimaryButton
          type="button"
          disabled={!valid}
          onClick={() => onChange(draft)}
          className="w-full sm:w-auto"
        >
          Save limit
        </PrimaryButton>
      </div>
      <p className="mt-4 text-xs text-morpho-muted">
        Saved for the next run:{" "}
        <span className="font-mono font-medium text-morpho-ink">
          {limitEth} ETH/day
        </span>
      </p>
    </Panel>
  );
}
