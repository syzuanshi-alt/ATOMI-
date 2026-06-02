import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getSupportRepositoryStatus } from "@/lib/repositories/support-repository";

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  return NextResponse.json({
    ...getSupportRepositoryStatus(),
    note: "Repository（数据访问层）状态用于确认当前读取 Demo 数据还是未来真实 PostgreSQL 数据。",
  });
}
