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
      ? "text-morpho-red"
      : kind === "ok"
        ? "text-morpho-green"
        : kind === "loading"
          ? "text-morpho-amber fc-loading"
          : "text-morpho-muted";
  return <p className={`text-sm font-medium ${tone}`}>{children}</p>;
}
