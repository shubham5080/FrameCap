import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-morpho-hero text-morpho-ink">
      {/* Band 1 — soft blue */}
      <div className="bg-morpho-hero">
        <SiteHeader />

        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="fc-enter max-w-xl">
              <h1 className="text-4xl font-bold tracking-tight text-morpho-ink sm:text-5xl md:text-[3.25rem] md:leading-[1.08]">
                A daily spend limit for Frame wallets.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-morpho-muted sm:text-lg">
                Set how much a wallet can spend today. FrameCap checks that
                limit before money moves. Over the limit? Blocked.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/app"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Open FrameCap
                </Link>
                <a
                  href="#how"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-morpho-lineStrong bg-white px-6 text-sm font-semibold text-morpho-ink transition hover:border-morpho-blue hover:text-morpho-blue"
                >
                  How it works
                </a>
              </div>
            </div>

            <div className="fc-enter fc-enter-delay-1 relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 shadow-panel sm:p-8">
                <div className="mb-6">
                  <p className="text-sm font-semibold text-white">
                    What you’ll see in the app
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Same spend · two mempools · clear outcomes
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    { k: "Public mempool", v: "Blocked", tone: "bad" as const },
                    { k: "Alt mempool (no stake)", v: "Blocked", tone: "bad" as const },
                    { k: "Alt mempool (staked)", v: "Allowed", tone: "ok" as const },
                    { k: "Over daily limit", v: "Blocked", tone: "bad" as const },
                  ].map((row) => (
                    <li
                      key={row.k}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-3"
                    >
                      <span className="text-sm text-zinc-100">{row.k}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.tone === "ok"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {row.v}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-morpho-blue py-3 text-sm font-semibold text-white transition hover:bg-morpho-blueHover"
                >
                  Try the live proof →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Band 2 — pure white */}
      <section id="how" className="bg-morpho-band">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-morpho-muted">
            What FrameCap is
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-morpho-ink sm:text-3xl">
            A spending guard for Frame wallets.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-morpho-muted">
            Think of it like a daily card limit, but checked onchain before the
            Frame transaction is accepted.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                t: "Pick a daily limit",
                d: "You choose how much the wallet may spend today.",
              },
              {
                n: "02",
                t: "Public path blocks the check",
                d: "Normal mempools reject this kind of limit check.",
              },
              {
                n: "03",
                t: "Alt path can allow it",
                d: "With stake, the alt mempool can accept the same spend — still blocking over-limit.",
              },
            ].map((item) => (
              <div key={item.n} className="fc-enter border-t border-morpho-line pt-5">
                <p className="font-mono text-xs text-morpho-blue">{item.n}</p>
                <h3 className="mt-2 text-lg font-semibold text-morpho-ink">
                  {item.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-morpho-muted">
                  {item.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Band 3 — soft blue again */}
      <section id="why" className="bg-morpho-hero">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-morpho-muted">
            Why the alternative mempool
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-morpho-ink sm:text-3xl">
            Flexible validation the public pool won’t allow.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-morpho-muted">
            Today most limits live in apps and bots — they can still fail.
            FrameCap enforces the cap onchain before money moves.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-morpho-line bg-white p-6 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-wide text-morpho-red">
                Canonical
              </p>
              <p className="mt-2 text-lg font-semibold text-morpho-ink">
                eth_sendRawTransaction
              </p>
              <p className="mt-2 text-sm leading-relaxed text-morpho-muted">
                VERIFY may not SLOAD another contract’s storage. Foreign
                QuotaLedger read → rejected.
              </p>
            </div>
            <div className="rounded-2xl border border-morpho-blue/20 bg-white p-6 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-wide text-morpho-blue">
                Staked alt mempool
              </p>
              <p className="mt-2 text-lg font-semibold text-morpho-ink">
                eth_sendFrameTransaction
              </p>
              <p className="mt-2 text-sm leading-relaxed text-morpho-muted">
                After stake on NaiveStakingRegistry, the workshop alt profile
                can admit the same Frame — quota still enforced onchain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Band 4 — pure white again */}
      <section className="bg-morpho-band">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-20">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-morpho-ink">
              Ready to see the spend limit live?
            </h2>
            <p className="mt-2 max-w-md text-sm text-morpho-muted">
              Open the app, set a small limit, and run the live proof.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-12 items-center justify-center rounded-full bg-morpho-blue px-7 text-sm font-semibold text-white transition hover:bg-morpho-blueHover"
          >
            Open FrameCap
          </Link>
        </div>
      </section>

      <footer className="bg-morpho-hero">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-morpho-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>FrameCap · Daily spend quotas for EIP-8141 Frames</p>
          <a
            className="font-medium text-morpho-blue hover:underline"
            href="https://github.com/shubham5080/FrameCap"
            target="_blank"
            rel="noreferrer"
          >
            GitHub →
          </a>
        </div>
      </footer>
    </div>
  );
}
