import { NextResponse } from "next/server";
import { listLabels } from "../../../server/issues";
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
    return NextResponse.json(await listLabels(session.workspace.id));
  } catch (error) {
    console.error("Failed to load labels", error);
    return NextResponse.json(
      { error: "Labels could not be loaded" },
      { status: 500 },
    );
  }
}
