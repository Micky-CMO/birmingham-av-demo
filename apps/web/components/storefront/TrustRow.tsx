export function TrustRow() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-small text-ink-500 dark:text-ink-300">
      <span className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse-green" />
        82K sold
      </span>
      <span aria-hidden>·</span>
      <span>98.4% positive</span>
      <span aria-hidden>·</span>
      <span>12-month warranty</span>
      <span aria-hidden>·</span>
      <span>Free UK shipping</span>
    </div>
  );
}
