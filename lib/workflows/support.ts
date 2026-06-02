import "server-only";
import { formatISO } from "date-fns";
import type { AiReplySuggestion, SupportMessage, SupportRiskLevel, SupportThread } from "@/lib/types";

const highRiskPatterns = [
  "refund",
  "chargeback",
  "cancel order",
  "complaint",
  "lawsuit",
  "退款",
  "取消订单",
  "投诉",
  "差评",
  "赔偿",
  "律师",
];

const mediumRiskPatterns = ["order", "tracking", "delivery", "shipping", "物流", "发货", "订单", "送达", "刻字", "定制"];

export const classifySupportRisk = (text: string): SupportRiskLevel => {
  const normalized = text.toLowerCase();

  if (highRiskPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()))) {
    return "high";
  }

  if (mediumRiskPatterns.some((pattern) => normalized.includes(pattern.toLowerCase()))) {
    return "medium";
  }

  return "low";
};

export const canAutoSendSupportReply = (riskLevel: SupportRiskLevel): boolean => riskLevel === "low";

export const buildSupportReplyDraft = (
  thread: SupportThread,
  message: SupportMessage,
): AiReplySuggestion => {
  const riskLevel = classifySupportRisk(message.originalText);
  const canAutoSend = canAutoSendSupportReply(riskLevel);
  const isEnglish = thread.language.startsWith("en");

  if (riskLevel === "high") {
    return {
      id: `draft_${message.id}`,
      threadId: thread.id,
      messageId: message.id,
      draftText: isEnglish
        ? "Hi, we have received your request. Our support team will review your order and follow up when online. AI will not make refund, compensation, or cancellation promises automatically."
        : "您好，已收到您的诉求。客服上班后会核实订单和问题详情后继续处理。AI 不会自动承诺退款、补偿或取消订单。",
      riskLevel,
      reason: "高风险售后或投诉内容，必须转人工审核，不能自动发送承诺类回复。",
      status: "pending_review",
      canAutoSend,
      createdAt: formatISO(new Date()),
    };
  }

  if (riskLevel === "medium") {
    return {
      id: `draft_${message.id}`,
      threadId: thread.id,
      messageId: message.id,
      draftText: isEnglish
        ? "Hi, thanks for your message. Please send your order number or purchase email so our support team can check faster. We will follow up when our team is online."
        : "您好，已收到您的消息。为了更快帮您处理，请提供订单号或下单邮箱。客服上班后会继续跟进。",
      riskLevel,
      reason: "订单、物流或定制咨询需要收集信息，AI 可以引导补充资料，但不承诺具体处理结果。",
      status: "pending_review",
      canAutoSend,
      createdAt: formatISO(new Date()),
    };
  }

  return {
    id: `draft_${message.id}`,
    threadId: thread.id,
    messageId: message.id,
    draftText: isEnglish
      ? "Hi, thanks for reaching out. Please share the product or engraving details you are interested in, and our team will help confirm the next step."
      : "您好，感谢咨询。请告诉我们您想了解的款式或刻字内容，我们会帮您确认下一步。",
    riskLevel,
    reason: "基础咨询属于低风险，AI 可在托管模式下引导客户补充信息。",
    status: "pending_review",
    canAutoSend,
    createdAt: formatISO(new Date()),
  };
};
