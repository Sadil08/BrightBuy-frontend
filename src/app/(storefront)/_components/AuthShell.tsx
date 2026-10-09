import { Logo } from "@/components/Logo";
import { ProductArt } from "@/components/ProductArt";
import { PriceTag } from "./PriceTag";

// Shared frame for login and register: a form on one side, a bright panel on the other (hidden on
// small screens so the form always comes first on a phone).
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="container-page grid min-h-[34rem] items-stretch gap-6 py-10 lg:grid-cols-2">
      <div className="card flex flex-col justify-center p-7 sm:p-10">
        <div className="lg:hidden"><Logo compact /></div>
        <h1 className="mt-4 text-4xl font-extrabold lg:mt-0">{title}</h1>
        <p className="mt-2 text-ink-soft">{subtitle}</p>
        <div className="mt-7">{children}</div>
        <p className="mt-6 text-sm text-ink-soft">{footer}</p>
      </div>
      <aside className="relative hidden overflow-hidden rounded-[var(--radius)] lg:block" aria-hidden="true">
        <ProductArt seed={5} label="BrightBuy" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/55 to-transparent p-8 pt-24 text-white">
          <PriceTag value="12.00" size="lg" />
          <p className="max-w-xs font-display text-2xl font-extrabold leading-tight">
            One account for your cart, your orders and your delivery dates.
          </p>
        </div>
      </aside>
    </main>
  );
}
