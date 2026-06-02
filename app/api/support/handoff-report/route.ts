import { NextResponse } from "next/server";
import { getDemoSnapshot } from "@/lib/demo-data";
import { requirePermission } from "@/lib/auth";

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const snapshot = getDemoSnapshot();

  return NextResponse.json({
    mode: "demo",
    note: "离线托管日报为模拟数据。真实模式必须按租户、时间窗口和客服排班生成。",
    reports: snapshot.handoffReports,
    highRiskThreads: snapshot.supportThreads.filter((item) => item.riskLevel === "high"),
    needsHumanThreads: snapshot.supportThreads.filter((item) => item.status === "needs_human"),
  });
}
