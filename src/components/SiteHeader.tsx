import Link from "next/link";
import { LogoLockup } from "@/components/Logo";

export function SiteHeader({
  ctaHref = "/app",
  ctaLabel = "Open app",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-transparent bg-morpho-hero/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-morpho-blueSoft"
          aria-label="FrameCap home"
        >
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-morpho-muted sm:flex">
          <a
            className="rounded-lg px-3 py-1.5 hover:bg-white/70 hover:text-morpho-ink"
            href="#how"
          >
            How it works
          </a>
          <a
            className="rounded-lg px-3 py-1.5 hover:bg-white/70 hover:text-morpho-ink"
            href="#why"
          >
            Why alt mempool
          </a>
        </nav>
        <Link
          href={ctaHref}
          className="inline-flex h-9 items-center rounded-full bg-morpho-blue px-4 text-sm font-semibold text-white transition hover:bg-morpho-blueHover"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
