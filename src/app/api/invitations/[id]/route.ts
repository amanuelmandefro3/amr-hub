import { NextRequest, NextResponse } from "next/server";
import { revokeInvitation } from "../../../../server/invitations";
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
  const revoked = await revokeInvitation(id, session.workspace.id);

  if (!revoked) {
    return NextResponse.json(
      { error: "Pending invitation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ revoked: true });
}
