// Pure helpers for the staff catalogue forms. Money stays a decimal STRING end to end (never a JS
// number — src/lib/money.ts), so these only validate/normalise text.

/** "12", "12.5", "12.50" -> "12.00" / "12.50" / "12.50"; anything else (negative, 3 decimals, text) -> null. */
export function parsePrice(input: string): string | null {
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  return `${match[1]}.${(match[2] ?? "").padEnd(2, "0")}`;
}

/** "Colour=Black, Size=M" -> [{name:"Colour",value:"Black"}, …]; returns null if any pair is malformed. */
export function parseAttributes(input: string): { name: string; value: string }[] | null {
  const text = input.trim();
  if (text === "") return [];
  const result: { name: string; value: string }[] = [];
  for (const pair of text.split(",")) {
    const [name, ...rest] = pair.split("=");
    const value = rest.join("=").trim();
    if (!name?.trim() || !value) return null;
    result.push({ name: name.trim(), value });
  }
  return result;
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // mirrors the backend's maxImageBytes
