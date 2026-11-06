"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { DemoConsole } from "@/components/DemoConsole";
import { DiffPanel } from "@/components/DiffPanel";
import { SetQuotaForm } from "@/components/SetQuotaForm";
import { StakeStatus } from "@/components/StakeStatus";
import { Badge } from "@/components/ui";

export default function Home() {
  const [limitGwei, setLimitGwei] = useState("5");

  return (
    <div className="min-h-screen bg-morpho-bg text-morpho-ink">
      <header className="sticky top-0 z-20 border-b border-morpho-line bg-morpho-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-morpho-blue text-sm font-bold text-white"
              aria-hidden
            >
              F
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">FrameCap</p>
              <p className="hidden text-[11px] text-morpho-muted sm:block">
                EIP-8141 · alt mempool
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 text-sm font-medium text-morpho-muted md:flex">
            <a className="rounded-lg px-3 py-1.5 text-morpho-ink bg-morpho-bg" href="#diff">
              Diff
            </a>
            <a className="rounded-lg px-3 py-1.5 hover:bg-morpho-bg hover:text-morpho-ink" href="#quota">
              Quota
            </a>
            <a className="rounded-lg px-3 py-1.5 hover:bg-morpho-bg hover:text-morpho-ink" href="#stake">
              Stake
            </a>
            <a className="rounded-lg px-3 py-1.5 hover:bg-morpho-bg hover:text-morpho-ink" href="#gateway">
              Gateway
            </a>
          </nav>
          <a
            className="inline-flex h-9 items-center rounded-xl border border-morpho-lineStrong bg-white px-3 text-xs font-semibold text-morpho-ink transition hover:border-morpho-blue hover:text-morpho-blue sm:text-sm"
            href={config.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            Explorer
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <section className="fc-enter mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="info">ETHGlobal Mumbai</Badge>
              <Badge tone="idle">EF Alt Mempool</Badge>
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-morpho-ink sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
              FrameCap
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-morpho-muted sm:text-lg">
              Daily spend caps inside EIP-8141 Frame VERIFY. Canonical mempool
              rejects foreign quota storage; the staked alt mempool admits the
              same Frame — until you go over quota.
            </p>
          </div>
          <div className="rounded-2xl border border-morpho-line bg-morpho-surface p-4 shadow-panel sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-morpho-muted">
              Judge path
            </p>
            <ol className="mt-3 space-y-2.5 text-sm text-morpho-ink">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-morpho-muted">01</span>
                Pick a daily limit (gwei)
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-morpho-muted">02</span>
                Run Diff — watch canonical reject
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-morpho-muted">03</span>
                Stake, then alt admits with explorer proof
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-morpho-muted">04</span>
                Over-quota VERIFY reverts (OverQuota)
              </li>
            </ol>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="fc-enter fc-enter-delay-1 space-y-4" id="quota">
            <SetQuotaForm limitGwei={limitGwei} onChange={setLimitGwei} />
            <div id="stake">
              <StakeStatus />
            </div>
            <div id="gateway">
              <DemoConsole />
            </div>
          </div>
          <div id="diff" className="space-y-4">
            <DiffPanel dailyLimitGwei={limitGwei} />
            <section className="rounded-2xl border border-morpho-line bg-morpho-surface p-5 text-sm shadow-panel sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-morpho-muted">
                Network
              </p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-morpho-muted">Gateway</dt>
                  <dd className="mt-0.5 break-anywhere font-mono text-xs text-morpho-ink">
                    {config.gatewayUrl}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-morpho-muted">Chain ID</dt>
                  <dd className="mt-0.5 font-mono text-sm text-morpho-ink">
                    {config.chainId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-morpho-muted">Profile</dt>
                  <dd className="mt-0.5 break-anywhere font-mono text-xs text-morpho-ink">
                    {config.profileId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-morpho-muted">Explorer</dt>
                  <dd className="mt-0.5">
                    <a
                      className="break-anywhere font-mono text-xs font-medium text-morpho-blue hover:underline"
                      href={config.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {config.explorerUrl}
                    </a>
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
