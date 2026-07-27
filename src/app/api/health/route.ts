import { NextResponse } from "next/server";
import prisma from "../../../../prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        database: "reachable",
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      {
        status: "unavailable",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
