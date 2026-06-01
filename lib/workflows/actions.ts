import "server-only";
import type { AiAction } from "@/lib/types";

export const requiresHumanApproval = (action: Pick<AiAction, "actionType" | "riskLevel">): boolean => {
  if (action.actionType === "budget_change" || action.actionType === "creator_message") {
    return true;
  }
  return action.riskLevel !== "low";
};

export const decideAction = (action: AiAction, decision: "approved" | "rejected"): AiAction => ({
  ...action,
  status: decision,
});
