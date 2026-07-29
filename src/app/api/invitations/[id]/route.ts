import { NextRequest, NextResponse } from "next/server";
import { revokeInvitation } from "../../../../server/invitations";
import {
  getRequestSession,
  unauthorizedResponse,
} from "../../../../server/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);
  if (!session) return unauthorizedResponse();
  if (session.user.role !== "OWNER") {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const revoked = await revokeInvitation(id);

  if (!revoked) {
    return NextResponse.json(
      { error: "Pending invitation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ revoked: true });
}
