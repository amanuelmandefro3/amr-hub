import { NextResponse } from "next/server";
import { listLabels } from "../../../server/issues";
import {
  getRequestSession,
  unauthorizedResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return unauthorizedResponse();

  try {
    return NextResponse.json(await listLabels());
  } catch (error) {
    console.error("Failed to load labels", error);
    return NextResponse.json(
      { error: "Labels could not be loaded" },
      { status: 500 },
    );
  }
}
