// Shared by the Route Handlers under src/app/api: turns a backend ApiError into the same JSON error
// shape and status the backend sent, so the browser-side code sees one consistent contract.
import { NextResponse } from "next/server";
import { ApiError } from "./index";

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    // Pass the whole backend body through (code, message, and any extras like unavailableLines).
    return NextResponse.json(
      { ...error.body, code: error.code, message: error.message },
      { status: error.status },
    );
  }
  console.error("unexpected error in route handler", error);
  return NextResponse.json({ code: "INTERNAL_ERROR", message: "Something went wrong." }, { status: 500 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ code: "INVALID_INPUT", message }, { status: 400 });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
