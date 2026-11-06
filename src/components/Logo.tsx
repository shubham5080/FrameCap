/** Icon-only mark (favicon / compact). */
export function LogoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/framecap-mark-solid.svg"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-[10px] ${className}`}
      aria-hidden
    />
  );
}

/**
 * Full brand lockup — icon + visible "FrameCap" name (HTML text so fonts always work).
 */
export function LogoWordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const icon = size === "lg" ? 52 : size === "sm" ? 28 : 36;
  const text =
    size === "lg"
      ? "text-4xl sm:text-5xl"
      : size === "sm"
        ? "text-base"
        : "text-xl sm:text-2xl";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark size={icon} />
      <span
        className={`font-bold tracking-tight text-morpho-ink ${text}`}
        style={{ letterSpacing: "-0.03em" }}
      >
        FrameCap
      </span>
    </div>
  );
}

/** Header lockup. */
export function LogoLockup() {
  return <LogoWordmark size="sm" />;
}
