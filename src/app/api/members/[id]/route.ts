import { NextRequest, NextResponse } from "next/server";
import { removeWorkspaceMember } from "../../../../server/members";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../../server/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();
  if (session.workspace.role !== "owner") {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "The workspace owner cannot be removed" },
      { status: 400 },
    );
  }

  const removed = await removeWorkspaceMember(id, session.workspace.id);
  if (!removed) {
    return NextResponse.json(
      { error: "Workspace member not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ removed: true });
}
