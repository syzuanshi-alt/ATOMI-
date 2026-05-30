import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

let prismaClient: PrismaClient | null = null;

export function getPrismaClient() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      adapter: new PrismaPg({
        connectionString:
          process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/shkf_dev?schema=public"
      })
    });
  }

  return prismaClient;
}
