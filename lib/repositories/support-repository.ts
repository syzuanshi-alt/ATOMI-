import "server-only";
import { getDemoRole } from "@/lib/auth";
import { demoSupportRepository } from "@/lib/repositories/demo-support-repository";
import type { SupportActor, SupportRepository } from "@/lib/repositories/support-types";

const DEMO_TENANT_ID = "demo_tenant_atomi_watch";

export const getSupportActor = (request: Request): SupportActor => {
  const role = getDemoRole(request);

  return {
    tenantId: DEMO_TENANT_ID,
    actorRef: `demo:${role}`,
    role,
    mode: "demo",
  };
};

export const getSupportRepository = (): SupportRepository => {
  return demoSupportRepository;
};
