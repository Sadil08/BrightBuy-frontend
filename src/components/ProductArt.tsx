// Products without an uploaded photo get generated art instead of a grey box: flat geometric
// compositions, deterministic per product id so a product always looks like itself, in soft brand
// tones. No gradients, no emoji. <ProductImage> uses a real photo when one exists and falls back to this.

const PALETTE = [
  { bg: "#aab4f5", a: "#f6c85f", b: "#ffffff", c: "#2c3366" }, // periwinkle
  { bg: "#2c3366", a: "#f6c85f", b: "#aab4f5", c: "#ffffff" }, // midnight
  { bg: "#f6d98c", a: "#2c3366", b: "#ffffff", c: "#e98a6b" }, // honey
  { bg: "#f4a98f", a: "#fbe3d6", b: "#ffffff", c: "#2c3366" }, // apricot
  { bg: "#9fd8c0", a: "#2c3366", b: "#ffffff", c: "#f6c85f" }, // sage
  { bg: "#ece7dc", a: "#4650d4", b: "#2c3366", c: "#f6c85f" }, // linen
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
  const onInk = palette.bg === "#2c3366";
  const plateFill = onInk ? "#f6c85f" : "#2c3366";
  const plateText = onInk ? "#2c3366" : "#ffffff";

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
            fontWeight="600"
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
