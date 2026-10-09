// Pure date helpers with no "use client" / "use server" marker, so BOTH Server Components (the order
// page) and Client Components (the delivery estimate widget) can import and call them. A function
// exported from a "use client" file can't be called from a Server Component.

/** "2026-10-14" -> "Wed, Oct 14". Built from the parts (not new Date("2026-10-14")) so a timezone
 *  behind UTC doesn't shift it back a day. */
export function formatEstimateDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
