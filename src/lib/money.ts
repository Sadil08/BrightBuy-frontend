// The ONE place money is parsed and formatted on the frontend. Prices arrive as decimal strings
// ("49.99", never a JSON number) and all arithmetic here is done in integer cents, for the same
// reason the backend's internal/shared/money does: floats drift (0.1 + 0.2), and a total that is a
// cent off is a bug a shopper notices.

/** "49.99" -> 4999. Throws on anything that is not a two-decimal money string. */
export function moneyToCents(value: string): number {
  const match = /^(-?)(\d+)\.(\d{2})$/.exec(value);
  if (!match) throw new Error(`Invalid money value returned by API: ${value}`);
  const cents = Number(match[2]) * 100 + Number(match[3]);
  return match[1] === "-" ? -cents : cents;
}

/** 4999 -> "49.99" (the wire format, no symbol or separators). */
export function centsToMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** "1599.98" or 159998 (cents) -> "$1,599.98", for display. */
export function formatUsd(value: string | number): string {
  const cents = typeof value === "number" ? value : moneyToCents(value);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  return `${sign}$${dollars}.${String(abs % 100).padStart(2, "0")}`;
}

/** Splits a display price so the cents can be styled smaller: "$1,599.98" -> ["$1,599", "98"]. */
export function splitUsd(value: string | number): [string, string] {
  const formatted = formatUsd(value);
  const dot = formatted.lastIndexOf(".");
  return [formatted.slice(0, dot), formatted.slice(dot + 1)];
}
