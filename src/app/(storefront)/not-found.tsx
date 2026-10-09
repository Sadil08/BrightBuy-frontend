import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page grid place-items-center py-24 text-center">
      <div className="max-w-md">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold">That page isn&apos;t on the shelf.</h1>
        <p className="mt-4 text-ink-soft">The product may have been removed, or the link is out of date.</p>
        <Link href="/products" className="btn btn-primary btn-lg mt-8">
          Browse all products
        </Link>
      </div>
    </main>
  );
}
