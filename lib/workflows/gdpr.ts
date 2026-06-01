import "server-only";
import { z } from "zod";

export const gdprRequestSchema = z.object({
  identity: z.string().min(3),
  mode: z.enum(["anonymize", "delete"]),
});

export const gdprAffectedSystems = [
  "orders",
  "support_tickets",
  "ad_audiences",
  "creator_crm_notes",
  "ai_training_examples",
  "audit_logs",
] as const;

export const createGdprWorkOrder = (identity: string, mode: "anonymize" | "delete") => ({
  id: `gdpr_${Date.now()}`,
  identity,
  mode,
  status: "queued" as const,
  affectedSystems: gdprAffectedSystems,
  createdAt: new Date().toISOString(),
});
