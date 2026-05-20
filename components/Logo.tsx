// Brand mark: a roof silhouette with an upward price trend line.
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl
        bg-gradient-to-br from-emerald-400 to-emerald-600 ${className}`}
    >
      <span className="absolute inset-0 rounded-xl bg-emerald-500/40 blur-md" aria-hidden />
      <svg
        viewBox="0 0 24 24"
        className="relative h-5 w-5"
        fill="none"
        stroke="#052e1c"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 11 12 4l9 7" />
        <path d="M6.5 16.5 10 13l3 2.5L18 10" />
      </svg>
    </span>
  );
}
