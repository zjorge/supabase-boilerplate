import { NextResponse } from "next/server";
import { healthResponseSchema } from "@/lib/api/health-schema";

export function GET(_request: Request) {
  const payload = healthResponseSchema.parse({
    status: "ok",
    service: "supabase-boilerplate",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(payload);
}
