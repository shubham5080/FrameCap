"use client";

import { useEffect, useState } from "react";
import {
  Field,
  GhostButton,
  Panel,
  PanelHint,
  PanelTitle,
  PrimaryButton,
} from "@/components/ui";

const STORAGE_KEY = "framecap.guardian.v1";

function loadStored(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Optional — who may edit limits and allowlist (not the spender key). */
export function GuardianPanel() {
  const [guardian, setGuardian] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadStored();
    setGuardian(stored);
    setDraft(stored);
  }, []);

  function persist(next: string) {
    setGuardian(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError(null);
      persist("");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setError("Paste a full 0x address (42 characters), or clear the field.");
      return;
    }
    setError(null);
    persist(trimmed);
  }

  const active = Boolean(guardian);

  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
        1c · Guardian · Optional
      </p>
      <PanelTitle>Who can change the rules?</PanelTitle>
      <PanelHint>
        Optional team / guardian control. The guardian can edit spend limits and
        the allowlist. The spending wallet cannot raise its own cap. Leave empty
        for the demo (Diff assigns the demo owner as guardian onchain).
      </PanelHint>

      <div
        className={
          active
            ? "mt-5 rounded-xl border border-morpho-blue/20 bg-morpho-blueSoft px-3.5 py-3 text-sm text-morpho-ink"
            : "mt-5 rounded-xl border border-morpho-line bg-morpho-hero/70 px-3.5 py-3 text-sm text-morpho-muted"
        }
      >
        {active
          ? `Guardian set — only this address can edit policy.`
          : "No guardian saved in the UI — live Diff still sets the demo wallet owner as guardian onchain."}
      </div>

      <label
        className="mt-5 mb-1.5 block text-xs font-medium text-morpho-muted"
        htmlFor="guardian-addr"
      >
        Guardian address (optional)
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="guardian-addr"
          type="text"
          placeholder="0x… parent, admin, or multisig"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="font-mono"
        />
        <PrimaryButton
          type="button"
          onClick={save}
          className="w-full shrink-0 sm:w-auto"
        >
          Save guardian
        </PrimaryButton>
      </div>
      {error && <p className="mt-2 text-xs text-morpho-red">{error}</p>}
      {active && (
        <div className="mt-3">
          <GhostButton
            type="button"
            onClick={() => {
              setDraft("");
              persist("");
              setError(null);
            }}
          >
            Clear guardian (UI only)
          </GhostButton>
        </div>
      )}
    </Panel>
  );
}
