import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  getSupportActor,
  getSupportRepository,
  withSupportRepositoryStatus,
} from "@/lib/repositories/support-repository";
import type { SupportChannel, SupportRiskLevel, SupportThread } from "@/lib/types";

type CountMap<T extends string> = Record<T, number>;

const emptyRiskBreakdown = (): CountMap<SupportRiskLevel> => ({
  low: 0,
  medium: 0,
  high: 0,
});

const increment = <T extends string>(map: Partial<CountMap<T>>, key: T): void => {
  map[key] = (map[key] ?? 0) + 1;
};

const previewText = (text: string): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
};

const riskRank = (riskLevel: SupportRiskLevel): number => {
  if (riskLevel === "high") return 0;
  if (riskLevel === "medium") return 1;
  return 2;
};

export async function GET(request: Request) {
  const forbidden = requirePermission(request, "support.read");
  if (forbidden) return forbidden;

  const repository = getSupportRepository();
  const actor = getSupportActor(request);
  const listResult = await repository.listThreads(actor);
  const detailResults = (
    await Promise.all(listResult.threads.map((thread) => repository.getThreadDetail(actor, thread.id)))
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const handoffResult = await repository.getHandoffReport(actor);

  const riskBreakdown = emptyRiskBreakdown();
  const channelBreakdown: Partial<CountMap<SupportChannel>> = {};
  for (const thread of listResult.threads) {
    increment(riskBreakdown, thread.riskLevel);
    increment(channelBreakdown, thread.channel);
  }

  const allDrafts = detailResults.flatMap((detail) => detail.aiReplySuggestions);
  const allApprovals = detailResults.flatMap((detail) => detail.aiApprovals);
  const allAuditLogs = detailResults.flatMap((detail) => detail.auditLogs);
  const allMessages = detailResults.flatMap((detail) => detail.messages);
  const allTranslations = detailResults.flatMap((detail) => detail.translations);
  const threadById = new Map(listResult.threads.map((thread): [string, SupportThread] => [thread.id, thread]));

  const pendingDrafts = allDrafts.filter((draft) => draft.status === "pending_review");
  const reviewQueue = allDrafts
    .filter((draft) => !draft.canAutoSend && draft.status !== "sent")
    .sort((a, b) => riskRank(a.riskLevel) - riskRank(b.riskLevel))
    .map((draft) => {
      const thread = threadById.get(draft.threadId);
      return {
        draftId: draft.id,
        threadId: draft.threadId,
        messageId: draft.messageId,
        subject: thread?.subject ?? "未知会话",
        channel: thread?.channel ?? "independent_site_chat",
        riskLevel: draft.riskLevel,
        status: draft.status,
        canAutoSend: draft.canAutoSend,
        reason: draft.reason,
        preview: previewText(draft.draftText),
        createdAt: draft.createdAt,
      };
    });

  const summary = {
    totalThreads: listResult.threads.length,
    openThreads: listResult.threads.filter((thread) => thread.status === "open").length,
    aiManagedThreads: listResult.threads.filter((thread) => thread.status === "ai_managed").length,
    needsHumanThreads: listResult.threads.filter((thread) => thread.status === "needs_human").length,
    highRiskThreads: listResult.threads.filter((thread) => thread.riskLevel === "high").length,
    mediumRiskThreads: listResult.threads.filter((thread) => thread.riskLevel === "medium").length,
    lowRiskThreads: listResult.threads.filter((thread) => thread.riskLevel === "low").length,
    totalMessages: allMessages.length,
    translatedMessages: allTranslations.length,
    totalDrafts: allDrafts.length,
    pendingDrafts: pendingDrafts.length,
    approvedDrafts: allDrafts.filter((draft) => draft.status === "approved").length,
    rejectedDrafts: allDrafts.filter((draft) => draft.status === "rejected").length,
    sentDrafts: allDrafts.filter((draft) => draft.status === "sent").length,
    autoSendCandidates: allDrafts.filter((draft) => draft.canAutoSend && draft.riskLevel === "low").length,
    blockedHighRiskDrafts: allDrafts.filter((draft) => draft.riskLevel === "high" && !draft.canAutoSend).length,
    approvalsCount: allApprovals.length,
    auditLogsCount: allAuditLogs.length + listResult.auditEvents.length + handoffResult.auditEvents.length,
  };

  const handoff = {
    reportsCount: handoffResult.reports.length,
    highRiskThreads: handoffResult.highRiskThreads.length,
    needsHumanThreads: handoffResult.needsHumanThreads.length,
    latestReportDate: handoffResult.reports[0]?.reportDate ?? null,
    latestSummary: handoffResult.reports[0]?.summary ?? null,
  };

  return NextResponse.json(
    withSupportRepositoryStatus({
      mode: listResult.mode,
      note: "AI 客服托管闭环汇总用于检查会话、草稿、审批、审计和日报是否完整。当前接口只汇总状态，不发送客户消息。",
      summary,
      riskBreakdown,
      channelBreakdown,
      reviewQueue,
      handoff,
      guardrails: {
        aiAutoSendEnabled: false,
        highRiskAutoSendBlocked: true,
        realCustomerMessageWriteEnabled: false,
        requiresHumanReviewForMediumHighRisk: true,
        noRealPlatformConnected: true,
      },
      persistenceTargets: listResult.persistenceTargets,
      auditEvents: [
        ...listResult.auditEvents,
        ...detailResults.flatMap((detail) => detail.auditEvents),
        ...handoffResult.auditEvents,
      ],
    }),
  );
}
