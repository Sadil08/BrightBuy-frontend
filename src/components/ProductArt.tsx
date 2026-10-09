// There are no product photos yet (the backend has no image field; product_image arrives with
// 07-admin-catalog). Rather than grey boxes, every product gets generated art: flat geometric
// compositions, deterministic per product id so a product always looks like itself, in the brand
// palette. No gradients, no emoji. When real images exist, swap the body of this component for an
// <Image> and keep the props.

const PALETTE = [
  { bg: "#2244f0", a: "#ffc61a", b: "#ffffff", c: "#11162b" }, // cobalt
  { bg: "#11162b", a: "#ffc61a", b: "#2244f0", c: "#ffffff" }, // ink
  { bg: "#ffc61a", a: "#11162b", b: "#2244f0", c: "#ffffff" }, // yellow
  { bg: "#ff6b4a", a: "#11162b", b: "#ffffff", c: "#ffc61a" }, // coral
  { bg: "#12a67a", a: "#11162b", b: "#ffffff", c: "#ffc61a" }, // green
  { bg: "#e9edf8", a: "#2244f0", b: "#11162b", c: "#ffc61a" }, // paper
];

function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]!.toUpperCase());
  return letters.join("") || "B";
}

export function ProductArt({
  seed,
  label,
  className = "",
  letters = true,
}: {
  seed: number;
  label: string;
  className?: string;
  // The initials sit on a solid plate so they stay legible whatever shapes are behind them. Pass
  // false where a label is drawn on top anyway (category tiles) or at thumbnail sizes.
  letters?: boolean;
}) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length]!;
  const layout = Math.abs(Math.floor(seed / PALETTE.length)) % 4;
  const text = initials(label);
  // On the ink-coloured tile the plate flips to yellow; everywhere else it is ink with white letters.
  const onInk = palette.bg === "#11162b";
  const plateFill = onInk ? "#ffc61a" : "#11162b";
  const plateText = onInk ? "#11162b" : "#ffffff";

  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="300" fill={palette.bg} />
      {layout === 0 && (
        <>
          <circle cx="300" cy="110" r="120" fill={palette.a} />
          <rect x="-20" y="200" width="260" height="120" fill={palette.c} opacity="0.9" />
          <circle cx="90" cy="90" r="34" fill={palette.b} />
        </>
      )}
      {layout === 1 && (
        <>
          <path d="M0 300V120C90 120 140 40 240 40v260Z" fill={palette.a} />
          <circle cx="320" cy="210" r="70" fill={palette.b} />
          <rect x="250" y="30" width="110" height="26" rx="13" fill={palette.c} />
        </>
      )}
      {layout === 2 && (
        <>
          <rect x="40" y="40" width="190" height="190" rx="28" fill={palette.a} />
          <circle cx="285" cy="205" r="82" fill={palette.c} opacity="0.95" />
          <path d="M280 40h90v90Z" fill={palette.b} />
        </>
      )}
      {layout === 3 && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={-10 + i * 86} y={i % 2 ? 60 : 20} width="48" height="320" rx="24" fill={i % 2 ? palette.a : palette.b} />
          ))}
          <circle cx="330" cy="70" r="46" fill={palette.c} />
        </>
      )}
      {letters && (
        <>
          <rect x="22" y="204" width={text.length > 1 ? 150 : 88} height="78" rx="16" fill={plateFill} />
          <text
            x="40"
            y="264"
            fontSize="62"
            fontWeight="800"
            fill={plateText}
            style={{ fontFamily: "var(--f-display), system-ui, sans-serif", letterSpacing: "-0.03em" }}
          >
            {text}
          </text>
        </>
      )}
    </svg>
  );
}
