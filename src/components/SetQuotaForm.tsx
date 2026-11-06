"use client";

import { useEffect, useState } from "react";
import {
  QUOTA_TOKENS,
  type QuotaTokenId,
  tokenMeta,
} from "@/lib/tokens";
import { Field, Panel, PanelHint, PanelTitle, PrimaryButton } from "@/components/ui";

/** Step 1 — daily spend limit in ETH / USDC / USDT. */
export function SetQuotaForm({
  token,
  limitAmount,
  onTokenChange,
  onLimitChange,
}: {
  token: QuotaTokenId;
  limitAmount: string;
  onTokenChange: (token: QuotaTokenId) => void;
  onLimitChange: (amount: string) => void;
}) {
  const [draft, setDraft] = useState(limitAmount);
  const parsed = Number(draft);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const meta = tokenMeta(token);

  useEffect(() => {
    setDraft(limitAmount);
  }, [limitAmount, token]);

  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
        1 · Limit
      </p>
      <PanelTitle>How much can this wallet spend today?</PanelTitle>
      <PanelHint>
        Pick an asset, then set the daily cap. Use a small number if you’re
        unsure. Live workshop proof still runs on ETH under the hood when you
        pick a stablecoin.
      </PanelHint>

      <p className="mt-5 mb-1.5 text-xs font-medium text-morpho-muted">
        Asset
      </p>
      <div className="flex flex-wrap gap-2">
        {QUOTA_TOKENS.map((t) => {
          const active = t.id === token;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onTokenChange(t.id);
                onLimitChange(t.defaultLimit);
                setDraft(t.defaultLimit);
              }}
              className={
                active
                  ? "inline-flex h-10 items-center rounded-full bg-morpho-blue px-4 text-sm font-semibold text-white"
                  : "inline-flex h-10 items-center rounded-full border border-morpho-lineStrong bg-white px-4 text-sm font-medium text-morpho-ink hover:border-morpho-blue hover:text-morpho-blue"
              }
            >
              {t.label}
              <span
                className={
                  active
                    ? "ml-1.5 text-xs font-normal text-white/80"
                    : "ml-1.5 text-xs font-normal text-morpho-muted"
                }
              >
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <label
        className="mt-5 mb-1.5 block text-xs font-medium text-morpho-muted"
        htmlFor="quota-amount"
      >
        Limit ({meta.label} per day)
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="quota-amount"
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
          onClick={() => onLimitChange(draft)}
          className="w-full sm:w-auto"
        >
          Save limit
        </PrimaryButton>
      </div>
      <p className="mt-4 text-xs text-morpho-muted">
        Saved for the next run:{" "}
        <span className="font-mono font-medium text-morpho-ink">
          {limitAmount} {meta.label}/day
        </span>
      </p>
    </Panel>
  );
}
