// One variant's inputs. Names repeat across rows (variantSku, variantPrice…) and the server action
// reads them by index, so the same fields serve "new product" (many rows) and "add variant" (one).
export function VariantFields({ index }: { index: number }) {
  const n = index + 1;
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
      <legend className="px-1 text-sm font-bold text-ink-soft">Variant {n}</legend>
      <label className="block">
        <span className="label">SKU</span>
        <input name="variantSku" required maxLength={50} className="input font-mono" placeholder="LAP-AIR-13" />
      </label>
      <label className="block">
        <span className="label">Price (USD)</span>
        <input name="variantPrice" required inputMode="decimal" className="input num" placeholder="799.99" />
      </label>
      <label className="block">
        <span className="label">Opening stock</span>
        <input name="variantStock" required inputMode="numeric" defaultValue="0" className="input num" />
      </label>
      <label className="block">
        <span className="label">Attributes (optional)</span>
        <input name="variantAttrs" className="input" placeholder="Colour=Black, Storage=256GB" />
      </label>
    </fieldset>
  );
}
