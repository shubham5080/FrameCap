"use client";

import { useState } from "react";
import { Field, Panel, PanelHint, PanelTitle, PrimaryButton } from "@/components/ui";

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
    <Panel>
      <PanelTitle>Daily quota</PanelTitle>
      <PanelHint>
        Cap written onchain when Diff runs. Frame VERIFY reads it from QuotaLedger
        — that foreign SLOAD is why canonical rejects.
      </PanelHint>
      <label
        className="mt-5 mb-1.5 block text-xs font-medium text-morpho-muted"
        htmlFor="quota-gwei"
      >
        Limit (gwei per day)
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="quota-gwei"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="sm:w-40"
        />
        <PrimaryButton
          type="button"
          disabled={!valid}
          onClick={() => onChange(draft)}
          className="w-full sm:w-auto"
        >
          Use for Diff
        </PrimaryButton>
      </div>
      <p className="mt-4 text-xs text-morpho-muted">
        Diff will deploy with{" "}
        <span className="font-mono font-medium text-morpho-ink">
          {limitGwei} gwei/day
        </span>
      </p>
    </Panel>
  );
}
