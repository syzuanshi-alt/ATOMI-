import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createGdprWorkOrder, gdprRequestSchema } from "@/lib/workflows/gdpr";

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "privacy.manage");
  if (forbidden) return forbidden;

  const body = gdprRequestSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  return NextResponse.json(createGdprWorkOrder(body.data.identity, body.data.mode));
}
