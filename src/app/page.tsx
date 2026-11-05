"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { DemoConsole } from "@/components/DemoConsole";
import { DiffPanel } from "@/components/DiffPanel";
import { SetQuotaForm } from "@/components/SetQuotaForm";
import { StakeStatus } from "@/components/StakeStatus";

export default function Home() {
  const [limitGwei, setLimitGwei] = useState("5");

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-16">
        <header className="space-y-3">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-emerald-400 sm:text-sm sm:tracking-[0.2em]">
            ETHGlobal Mumbai · EF Alt Mempool
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            FrameCap
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Daily spend quotas enforced in EIP-8141 Frame validation. The
            canonical public mempool rejects flexible quota state access; the
            staked alternative mempool can admit it.
          </p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
          <h2 className="text-sm font-medium text-zinc-300">Demo spine</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-400 sm:text-base">
            <li>Set a daily quota onchain</li>
            <li>Canonical path rejects the Frame tx</li>
            <li>Stake → alt mempool admits → explorer proof</li>
            <li>Over-quota attempt is blocked</li>
          </ol>
        </section>

        <SetQuotaForm limitGwei={limitGwei} onChange={setLimitGwei} />

        <StakeStatus />

        <DemoConsole />

        <DiffPanel dailyLimitGwei={limitGwei} />

        <section className="grid gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400 sm:p-6">
          <p className="break-anywhere">
            <span className="text-zinc-200">Gateway:</span> {config.gatewayUrl}
          </p>
          <p>
            <span className="text-zinc-200">Chain ID:</span> {config.chainId}
          </p>
          <p className="break-anywhere">
            <span className="text-zinc-200">Explorer:</span>{" "}
            <a
              className="text-emerald-400 underline-offset-2 hover:underline"
              href={config.explorerUrl}
              target="_blank"
              rel="noreferrer"
            >
              {config.explorerUrl}
            </a>
          </p>
          <p className="break-anywhere">
            <span className="text-zinc-200">Profile:</span> {config.profileId}
          </p>
        </section>
      </div>
    </main>
  );
}
