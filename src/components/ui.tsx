import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-morpho-line bg-morpho-surface p-5 shadow-panel sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[15px] font-semibold tracking-tight text-morpho-ink">
      {children}
    </h2>
  );
}

export function PanelHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-sm leading-relaxed text-morpho-muted">{children}</p>;
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-11 items-center justify-center rounded-xl bg-morpho-blue px-5 text-sm font-semibold text-white transition hover:bg-morpho-blueHover disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    />
  );
}

export function GhostButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-medium text-morpho-blue transition hover:bg-morpho-blueSoft disabled:opacity-40 ${className}`}
    />
  );
}

export function Field({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-morpho-lineStrong bg-white px-3.5 text-sm text-morpho-ink outline-none transition placeholder:text-morpho-muted focus:border-morpho-blue focus:ring-2 focus:ring-morpho-blueSoft ${className}`}
    />
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "ok" | "bad" | "idle" | "info";
  children: ReactNode;
}) {
  const styles =
    tone === "ok"
      ? "bg-morpho-greenSoft text-morpho-green"
      : tone === "bad"
        ? "bg-morpho-redSoft text-morpho-red"
        : tone === "info"
          ? "bg-morpho-blueSoft text-morpho-blue"
          : "bg-morpho-bg text-morpho-muted";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}
    >
      {children}
    </span>
  );
}
