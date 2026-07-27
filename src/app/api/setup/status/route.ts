import { NextResponse } from "next/server";
import prisma from "../../../../../prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const userCount = await prisma.user.count();

  return NextResponse.json(
    { setupAvailable: userCount === 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
