import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSupportActor, getSupportRepository, withSupportRepositoryStatus } from "@/lib/repositories/support-repository";

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const result = await getSupportRepository().getHandoffReport(getSupportActor(request));
  return NextResponse.json(withSupportRepositoryStatus(result));
}
