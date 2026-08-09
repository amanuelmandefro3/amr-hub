import { NextRequest, NextResponse } from "next/server";
import { listOrganizationMembers } from "../../../server/members";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  try {
    return NextResponse.json(
      await listOrganizationMembers(session.workspace.id),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load workspace members", error);
    return NextResponse.json(
      { error: "Workspace members could not be loaded" },
      { status: 500 },
    );
  }
}
