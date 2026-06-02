import "server-only";
import { getRequestContext } from "@/lib/request-context";
import { demoSupportRepository } from "@/lib/repositories/demo-support-repository";
import type { SupportActor, SupportRepository } from "@/lib/repositories/support-types";

export const getSupportActor = (request: Request): SupportActor => {
  return getRequestContext(request);
};

export const getSupportRepository = (): SupportRepository => {
  return demoSupportRepository;
};
