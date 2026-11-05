import type { ReactNode } from "react";

/** Shared loading / error / idle copy for demo panels. */
export function StatusLine({
  kind,
  children,
}: {
  kind: "loading" | "error" | "ok" | "idle";
  children: ReactNode;
}) {
  const tone =
    kind === "error"
      ? "text-red-400"
      : kind === "ok"
        ? "text-emerald-400"
        : kind === "loading"
          ? "text-amber-300"
          : "text-zinc-500";
  return <p className={`text-sm ${tone}`}>{children}</p>;
}
