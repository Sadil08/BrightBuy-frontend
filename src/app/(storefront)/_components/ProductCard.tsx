import Link from "next/link";
import type { ProductSummary } from "@/lib/api-client/catalog";
import { ProductArt } from "@/components/ProductArt";
import { PriceTag } from "./PriceTag";
import { StockBadge } from "./StockBadge";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.productId}`}
      className="group card flex h-full flex-col overflow-hidden no-underline transition duration-200 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductArt
          seed={product.productId}
          label={product.name}
          letters={false}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
        <div className="absolute bottom-3 right-3">
          <PriceTag value={product.priceFrom} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[1.05rem] font-bold leading-snug text-ink">{product.name}</h3>
        <div className="mt-auto pt-1">
          <StockBadge status={product.stockStatus} />
        </div>
      </div>
    </Link>
  );
}
