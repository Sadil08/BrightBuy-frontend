import Link from "next/link";

// The wordmark: "Bright" in ink, "Buy" in a yellow price-tag shape. The tag is the brand's one
// recurring motif (it comes back on every price in the shop).
export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} aria-label="BrightBuy home" className="inline-flex items-center gap-0.5 no-underline">
      <span className="font-display text-[1.45rem] font-extrabold tracking-tight text-ink">Bright</span>
      <span
        className="font-display text-[1.45rem] font-extrabold tracking-tight text-tag-ink"
        style={{
          background: "var(--tag)",
          padding: "0 0.4rem 0 0.7rem",
          borderRadius: "0.25rem 0.45rem 0.45rem 0.25rem",
          clipPath: "polygon(0.45rem 0, 100% 0, 100% 100%, 0.45rem 100%, 0 50%)",
        }}
      >
        Buy
      </span>
      {!compact && <span className="sr-only"> electronics and toys</span>}
    </Link>
  );
}
