import "server-only";
import type {
  HandoffReportResult,
  SupportRepository,
  SupportThreadDetailResult,
  SupportThreadListResult,
} from "@/lib/repositories/support-types";

const notImplemented = async (): Promise<never> => {
  throw new Error(
    "PostgreSQL Repository（真实数据库访问层）仍是占位实现。当前阶段只定义边界，不连接真实数据库。",
  );
};

export const postgresSupportRepository: SupportRepository = {
  async listThreads(): Promise<SupportThreadListResult> {
    return notImplemented();
  },

  async getThreadDetail(): Promise<SupportThreadDetailResult | null> {
    return notImplemented();
  },

  async createInboundMessage() {
    return notImplemented();
  },

  async createAiDraft() {
    return notImplemented();
  },

  async reviewAiDraft() {
    return notImplemented();
  },

  async getHandoffReport(): Promise<HandoffReportResult> {
    return notImplemented();
  },
};
