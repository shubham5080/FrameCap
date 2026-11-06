"use client";

import { useState } from "react";
import Link from "next/link";
import { config } from "@/lib/config";
import type { QuotaTokenId } from "@/lib/tokens";
import { DemoConsole } from "@/components/DemoConsole";
import { DiffPanel } from "@/components/DiffPanel";
import { AllowlistPanel } from "@/components/AllowlistPanel";
import { SetQuotaForm } from "@/components/SetQuotaForm";
import { StakeStatus } from "@/components/StakeStatus";
import { LogoLockup } from "@/components/Logo";

export default function AppPage() {
  const [token, setToken] = useState<QuotaTokenId>("ETH");
  const [limitAmount, setLimitAmount] = useState("0.001");
  const [showExtras, setShowExtras] = useState(false);

  return (
    <div className="min-h-screen bg-morpho-hero text-morpho-ink">
      <header className="sticky top-0 z-20 border-b border-morpho-line/60 bg-morpho-hero/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-morpho-blueSoft"
            aria-label="FrameCap home"
          >
            <LogoLockup />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-morpho-muted hover:text-morpho-ink sm:inline-flex"
            >
              ← Home
            </Link>
            <a
              className="inline-flex h-9 items-center rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:bg-zinc-800 sm:text-sm"
              href={config.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              Explorer
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        {/* Product story — what users should understand */}
        <section className="fc-enter rounded-[28px] border border-morpho-line bg-white p-6 shadow-panel sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
            What FrameCap does
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-morpho-ink sm:text-4xl">
            Stop a Frame wallet from spending too much in one day.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-morpho-muted">
            You set a daily money limit and who the wallet may pay. Before a
            spend goes through, FrameCap checks both onchain. Over the limit or
            not on the allowlist? Blocked.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                t: "You set a limit",
                d: "Example: only 0.001 ETH, or 10 USDC / USDT, can leave today.",
              },
              {
                t: "Optional allowlist",
                d: "Lock who can get paid — or skip it and only use the daily cap.",
              },
              {
                t: "Bad spend = blocked",
                d: "Over limit or wrong destination — stopped before money moves.",
              },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-2xl bg-morpho-hero px-4 py-4"
              >
                <p className="text-sm font-semibold text-morpho-ink">{item.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-morpho-muted">
                  {item.d}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-morpho-line bg-morpho-hero/70 px-4 py-4 text-sm text-morpho-muted">
            <p className="font-medium text-morpho-ink">Why this needs a special mempool</p>
            <p className="mt-1 leading-relaxed">
              The normal public mempool blocks this kind of limit check. The
              staked alternative mempool can allow it — that’s the special part
              FrameCap shows. Today most limits live in apps and bots — they can
              still fail. FrameCap enforces the cap onchain before money moves.
            </p>
          </div>
        </section>

        {/* Demo — clearly labeled as proof */}
        <section className="fc-enter fc-enter-delay-1 mt-6 rounded-[28px] border border-morpho-line bg-white p-6 shadow-panel sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-morpho-blue">
            Live proof
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-morpho-ink">
            See it happen on the test network
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-morpho-muted">
            This is not a setup wizard. It is a short live proof: same spend
            request, public path blocks it, alt path can allow it, over-limit
            still blocked. Takes about 1–3 minutes.
          </p>

          <ol className="mt-5 space-y-2 text-sm text-morpho-ink">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-morpho-blue">1</span>
              Pick ETH, USDC, or USDT and save a small daily limit.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-morpho-blue">2</span>
              Run the live proof and wait for four results.
            </li>
          </ol>
        </section>

        <div className="mt-4 space-y-4" id="demo">
          <SetQuotaForm
            token={token}
            limitAmount={limitAmount}
            onTokenChange={setToken}
            onLimitChange={setLimitAmount}
          />
          <AllowlistPanel />
          <DiffPanel dailyLimitAmount={limitAmount} token={token} />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowExtras((v) => !v)}
            className="text-sm font-medium text-morpho-blue hover:underline"
          >
            {showExtras ? "Hide network tools" : "Show network tools (optional)"}
          </button>
          {showExtras && (
            <div className="mt-4 space-y-4" id="gateway">
              <DemoConsole />
              <StakeStatus />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
