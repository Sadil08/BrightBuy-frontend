import { ProductArt } from "./ProductArt";

// A product's picture: the uploaded photo when there is one, generated art otherwise. Used by the
// product cards, the home page hero and the product page so they always agree. Plain <img>: the
// object store's host differs per environment, so next/image would need a remotePatterns entry for
// every deployment.
export function ProductImage({
  src,
  productId,
  name,
  className = "",
  eager = false,
}: {
  src?: string;
  productId: number;
  name: string;
  className?: string;
  eager?: boolean;
}) {
  if (!src) return <ProductArt seed={productId} label={name} letters={false} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} loading={eager ? "eager" : "lazy"} decoding="async" className={`object-cover ${className}`} />
  );
}
