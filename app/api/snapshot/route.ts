import { NextResponse } from "next/server";
import { getDemoSnapshot } from "@/lib/demo-data";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "dashboard.read");
  if (forbidden) return forbidden;

  return NextResponse.json(getDemoSnapshot());
}
