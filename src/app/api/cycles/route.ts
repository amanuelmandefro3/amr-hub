import { NextResponse } from "next/server";
import { listCycles } from "../../../server/cycles";
import {
  getRequestSession,
  unauthorizedResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return unauthorizedResponse();

  try {
    return NextResponse.json(await listCycles());
  } catch (error) {
    console.error("Failed to load cycles", error);
    return NextResponse.json(
      { error: "Cycles could not be loaded" },
      { status: 500 },
    );
  }
}
