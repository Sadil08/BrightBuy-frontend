import { splitUsd } from "@/lib/money";

// The brand's signature element (see .price-tag in globals.css): yellow, cut corner, tabular
// figures, cents set smaller. Every price in the storefront is one of these, so a yellow tag always
// means "this is what it costs".
export function PriceTag({
  value,
  from = false,
  size = "md",
}: {
  value: string;
  from?: boolean;
  size?: "md" | "lg";
}) {
  const [whole, cents] = splitUsd(value);
  return (
    <span className="price-tag" style={{ fontSize: size === "lg" ? "1.9rem" : "1.1rem" }}>
      {from && <span className="cur mr-1 font-sans text-[0.55em] font-bold uppercase tracking-wider">from</span>}
      <span>{whole}</span>
      <span className="cur">.{cents}</span>
    </span>
  );
}
