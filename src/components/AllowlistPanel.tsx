"use client";

import { useEffect, useState } from "react";
import { config } from "@/lib/config";
import {
  Field,
  GhostButton,
  Panel,
  PanelHint,
  PanelTitle,
  PrimaryButton,
} from "@/components/ui";

const STORAGE_KEY = "framecap.allowlist.v1";

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function loadStored(): string[] {
  if (typeof window === "undefined") return [config.recipient];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [config.recipient];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [config.recipient];
    const addrs = parsed.filter(
      (x): x is string =>
        typeof x === "string" && /^0x[a-fA-F0-9]{40}$/.test(x),
    );
    return addrs.length > 0 ? addrs : [config.recipient];
  } catch {
    return [config.recipient];
  }
}

/** Step — destinations this wallet is allowed to send to. */
export function AllowlistPanel() {
  const [addrs, setAddrs] = useState<string[]>([config.recipient]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAddrs(loadStored());
  }, []);

  function persist(next: string[]) {
    setAddrs(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private mode
    }
  }

  function add() {
    const trimmed = draft.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      setError("Paste a full 0x address (42 characters).");
      return;
    }
    const lower = trimmed.toLowerCase();
    if (addrs.some((a) => a.toLowerCase() === lower)) {
      setError("That address is already on the allowlist.");
      return;
    }
    setError(null);
    setDraft("");
    persist([...addrs, trimmed]);
  }

  function remove(addr: string) {
    const next = addrs.filter((a) => a.toLowerCase() !== addr.toLowerCase());
    // Always keep at least the workshop recipient so Diff still has a target.
    if (next.length === 0) {
      persist([config.recipient]);
      return;
    }
    persist(next);
  }

  return (
    <Panel>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
        1b · Destinations
      </p>
      <PanelTitle>Who can this wallet send to?</PanelTitle>
      <PanelHint>
        Allowlisted destinations only. If an address is not on this list, the
        spend is blocked — even under the daily cap. Live Diff uses the workshop
        recipient below.
      </PanelHint>

      <ul className="mt-5 space-y-2">
        {addrs.map((a) => (
          <li
            key={a}
            className="flex items-center justify-between gap-3 rounded-xl border border-morpho-line bg-morpho-bg px-3.5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-morpho-ink">{a}</p>
              {a.toLowerCase() === config.recipient.toLowerCase() && (
                <p className="mt-0.5 text-[11px] text-morpho-muted">
                  Workshop Diff recipient · {shortAddr(a)}
                </p>
              )}
            </div>
            <GhostButton type="button" onClick={() => remove(a)}>
              Remove
            </GhostButton>
          </li>
        ))}
      </ul>

      <label
        className="mt-5 mb-1.5 block text-xs font-medium text-morpho-muted"
        htmlFor="allow-dest"
      >
        Add destination address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field
          id="allow-dest"
          type="text"
          placeholder="0x…"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="font-mono"
        />
        <PrimaryButton
          type="button"
          onClick={add}
          className="w-full shrink-0 sm:w-auto"
        >
          Add address
        </PrimaryButton>
      </div>
      {error && (
        <p className="mt-2 text-xs text-morpho-red">{error}</p>
      )}
    </Panel>
  );
}
