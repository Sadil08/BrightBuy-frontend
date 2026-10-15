"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon, SparkleIcon } from "@/components/icons";

interface Suggestion {
  productId: number;
  name: string;
  priceFrom: string;
}

// A search input with a live suggestions dropdown. Still a real GET form to /products, so submitting
// works without JavaScript; the dropdown is an enhancement.
export function SearchBox({
  id,
  placeholder,
  variant,
  className = "",
  defaultValue = "",
  categoryId,
}: {
  id: string;
  placeholder: string;
  variant: "header" | "hero";
  className?: string;
  defaultValue?: string;
  categoryId?: number;
}) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/suggest?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { items: Suggestion[] };
        setItems(data.items);
        setActive(-1);
      } catch {
        /* aborted or offline: keep whatever is showing */
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const showList = open && value.trim().length >= 2 && items.length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && showList && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(`/products/${items[active].productId}`);
    }
  };

  const input = (
    <input
      id={id}
      type="search"
      name="q"
      value={value}
      autoComplete="off"
      role="combobox"
      aria-expanded={showList}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      placeholder={placeholder}
      onChange={(e) => {
        setValue(e.target.value);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
      className={
        variant === "header"
          ? "input !rounded-full !bg-surface !py-2.5 !pl-11"
          : "min-w-0 flex-1 bg-transparent py-2.5 text-[0.98rem] text-ink outline-none placeholder:text-ink-faint"
      }
    />
  );

  const list = showList && (
    <ul
      id={listId}
      role="listbox"
      className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-paper py-1 text-left shadow-lg"
    >
      {items.map((p, i) => (
        <li key={p.productId} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
          <a
            href={`/products/${p.productId}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-ink no-underline ${i === active ? "bg-surface-2" : ""}`}
          >
            <span className="truncate">{p.name}</span>
            <span className="shrink-0 text-ink-faint">from ${p.priceFrom}</span>
          </a>
        </li>
      ))}
      <li role="presentation" className="border-t border-line">
        <a
          href={`/products?q=${encodeURIComponent(value.trim())}${categoryId !== undefined ? `&categoryId=${categoryId}` : ""}`}
          className="block px-4 py-2.5 text-sm font-semibold text-action no-underline"
        >
          See all results for “{value.trim()}”
        </a>
      </li>
    </ul>
  );

  if (variant === "header") {
    return (
      <form ref={rootRef} action="/products" method="GET" role="search" className={`relative ${className}`}>
        <label htmlFor={id} className="sr-only">Search products</label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        {categoryId !== undefined && <input type="hidden" name="categoryId" value={categoryId} />}
        {input}
        {list}
      </form>
    );
  }

  return (
    <form ref={rootRef} action="/products" method="GET" role="search" className={`glass relative flex items-center gap-2 rounded-full p-1.5 pl-5 ${className}`}>
      <label htmlFor={id} className="sr-only">What are you looking for?</label>
      <SparkleIcon className="text-action" />
      {input}
      <button type="submit" className="btn btn-primary !py-2.5">Find it</button>
      {list}
    </form>
  );
}
