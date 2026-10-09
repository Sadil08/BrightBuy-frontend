// Where to send someone after they sign in. It comes from a hidden form field (set from ?next=), so
// it is user-controlled input: only a same-site absolute PATH is accepted. "//evil.com",
// "https://evil.com" and backslash tricks would turn the login page into an open redirect, so they
// all fall back to "/".
export function safeNext(value: FormDataEntryValue | null | undefined): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}
