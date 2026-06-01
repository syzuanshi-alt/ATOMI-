import { NextResponse } from "next/server";
import { getDemoRole } from "@/lib/auth";
import { rolePermissions } from "@/lib/permissions";

export async function GET(request: Request) {
  const role = getDemoRole(request);
  return NextResponse.json({
    role,
    permissions: rolePermissions[role],
    note: "Demo auth uses x-demo-role header or demo_role cookie. Replace with real session auth in production.",
  });
}
