// Parses one raw Set-Cookie header value (as the backend sends it) into the structured shape
// Next.js's cookies().set(name, value, options) wants. Needed because Server Actions can't forward a
// raw Set-Cookie header the way a Route Handler can (see src/app/actions/auth.ts) — cookies() only
// accepts individual, typed options, so the backend's own cookie decision (httpOnly/secure/sameSite/
// maxAge — made once, in shared/auth.SetAuthCookies on the Go side) has to be read back OUT of its
// own header rather than re-decided here, which would risk the two sides drifting apart.
export interface ParsedCookie {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export function parseSetCookie(raw: string): ParsedCookie {
  const segments = raw.split(";").map((s) => s.trim());

  const [name, ...valueParts] = segments[0].split("=");
  const value = valueParts.join("="); // defensive: a value containing "=" is still joined back correctly

  const parsed: ParsedCookie = { name, value, httpOnly: false, secure: false };

  for (const attribute of segments.slice(1)) {
    const [rawKey, rawValue] = attribute.split("=");
    switch (rawKey.toLowerCase()) {
      case "max-age":
        parsed.maxAge = Number(rawValue);
        break;
      case "path":
        parsed.path = rawValue;
        break;
      case "httponly":
        parsed.httpOnly = true;
        break;
      case "secure":
        parsed.secure = true;
        break;
      case "samesite":
        parsed.sameSite = (rawValue?.toLowerCase() as ParsedCookie["sameSite"]) ?? "lax";
        break;
    }
  }

  return parsed;
}
