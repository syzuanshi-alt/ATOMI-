import { NextResponse } from "next/server";
import { z } from "zod";
import { callProvider } from "@/lib/connectors/base";
import { requirePermission } from "@/lib/auth";

const integrationSchema = z.object({
  provider: z.enum(["shopify", "meta_ads", "tiktok_ads", "instagram_graph", "logistics", "support", "csv"]),
  accountRef: z.string().min(2),
});

export async function POST(request: Request) {
  const forbidden = requirePermission(request, "integrations.manage");
  if (forbidden) return forbidden;

  const body = integrationSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await callProvider(
    {
      provider: body.data.provider,
      endpoint: "connection_probe",
      accountRef: body.data.accountRef,
    },
    async () => ({
      status: "connected",
      note: "Demo probe only. Replace fetcher after AS provides real API credentials.",
    }),
  );

  return NextResponse.json(result);
}
