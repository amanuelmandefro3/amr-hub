import { NextResponse } from "next/server";
import { listCycles } from "../../../server/cycles";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  try {
    return NextResponse.json(await listCycles(session.workspace.id));
  } catch (error) {
    console.error("Failed to load cycles", error);
    return NextResponse.json(
      { error: "Cycles could not be loaded" },
      { status: 500 },
    );
  }
}
