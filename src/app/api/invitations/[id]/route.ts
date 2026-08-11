import { NextRequest, NextResponse } from "next/server";
import { revokeInvitation } from "../../../../server/invitations";
import { requireWorkspaceRole } from "../../../../server/session";

function forbiddenResponse() {
  return NextResponse.json(
    { error: "Owner access required" },
    { status: 403 },
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const result = await requireWorkspaceRole(
    request,
    ["owner"],
    forbiddenResponse,
  );
  if ("response" in result) return result.response;
  const { session } = result;

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
