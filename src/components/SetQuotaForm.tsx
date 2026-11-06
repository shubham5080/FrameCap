"use client";

import { useEffect, useState } from "react";
import {
  QUOTA_TOKENS,
  type QuotaTokenId,
  tokenMeta,
} from "@/lib/tokens";
import { Field, Panel, PanelHint, PanelTitle, PrimaryButton } from "@/components/ui";

export type LimitPeriod = "daily" | "weekly" | "monthly";

const PERIODS: { id: LimitPeriod; label: string; hint: string }[] = [
  { id: "daily", label: "Daily", hint: "Required" },
  { id: "weekly", label: "Weekly", hint: "Optional" },
  { id: "monthly", label: "Monthly", hint: "Optional" },
];

/** Step 1 — spend limits by period + asset. */
export function SetQuotaForm({
  token,
  dailyAmount,
  weeklyAmount,
  monthlyAmount,
  onTokenChange,
  onDailyChange,
  onWeeklyChange,
  onMonthlyChange,
}: {
  token: QuotaTokenId;
  dailyAmount: string;
  weeklyAmount: string;
  monthlyAmount: string;
  onTokenChange: (token: QuotaTokenId) => void;
  onDailyChange: (amount: string) => void;
  onWeeklyChange: (amount: string) => void;
  onMonthlyChange: (amount: string) => void;
}) {
  const [period, setPeriod] = useState<LimitPeriod>("daily");
  const amount =
    period === "daily"
      ? dailyAmount
      : period === "weekly"
        ? weeklyAmount
        : monthlyAmount;
  const [draft, setDraft] = useState(amount);
  const parsed = Number(draft);
  const valid =
    period === "daily"
      ? Number.isFinite(parsed) && parsed > 0
      : draft.trim() === "" || (Number.isFinite(parsed) && parsed >= 0);
  const meta = tokenMeta(token);

  useEffect(() => {
    setDraft(amount);
  }, [amount, period, token]);

  function save() {
    if (period === "daily") onDailyChange(draft);
    else if (period === "weekly") onWeeklyChange(draft.trim() === "" ? "" : draft);
    else onMonthlyChange(draft.trim() === "" ? "" : draft);
  }

  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
        1 · Limits
      </p>
      <PanelTitle>How much can this wallet spend?</PanelTitle>
      <PanelHint>
        Set a <span className="font-medium text-morpho-ink">daily</span> cap
        (required for the live proof). Weekly and monthly are optional — leave
        them blank to skip. Live workshop proof still settles in ETH when you
        pick a stablecoin.
      </PanelHint>

      <p className="mt-5 mb-1.5 text-xs font-medium text-morpho-muted">
        Period
      </p>
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => {
          const active = p.id === period;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={
                active
                  ? "inline-flex h-10 items-center rounded-full bg-morpho-blue px-4 text-sm font-semibold text-white"
                  : "inline-flex h-10 items-center rounded-full border border-morpho-lineStrong bg-white px-4 text-sm font-medium text-morpho-ink hover:border-morpho-blue hover:text-morpho-blue"
              }
            >
              {p.label}
              <span
                className={
                  active
                    ? "ml-1.5 text-xs font-normal text-white/80"
                    : "ml-1.5 text-xs font-normal text-morpho-muted"
                }
              >
                {p.hint}
              </span>
            </button>
          );
        })}
      </div>

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
                onDailyChange(t.defaultLimit);
                onWeeklyChange("");
                onMonthlyChange("");
                if (period === "daily") setDraft(t.defaultLimit);
                else setDraft("");
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
        {period === "daily"
          ? `Daily limit (${meta.label})`
          : period === "weekly"
            ? `Weekly limit (${meta.label}, optional)`
            : `Monthly limit (${meta.label}, optional)`}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="quota-amount"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          placeholder={period === "daily" ? meta.defaultLimit : "Leave blank to skip"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="sm:w-52"
        />
        <PrimaryButton
          type="button"
          disabled={!valid}
          onClick={save}
          className="w-full sm:w-auto"
        >
          Save {period} limit
        </PrimaryButton>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-morpho-muted sm:grid-cols-3">
        <p>
          Daily:{" "}
          <span className="font-mono font-medium text-morpho-ink">
            {dailyAmount} {meta.label}
          </span>
        </p>
        <p>
          Weekly:{" "}
          <span className="font-mono font-medium text-morpho-ink">
            {weeklyAmount ? `${weeklyAmount} ${meta.label}` : "off"}
          </span>
        </p>
        <p>
          Monthly:{" "}
          <span className="font-mono font-medium text-morpho-ink">
            {monthlyAmount ? `${monthlyAmount} ${meta.label}` : "off"}
          </span>
        </p>
      </div>
    </Panel>
  );
}
