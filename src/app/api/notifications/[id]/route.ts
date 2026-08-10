import { NextRequest, NextResponse } from "next/server";
import { markNotificationRead } from "../../../../server/notifications";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../../server/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  const { id } = await context.params;
  const notification = await markNotificationRead(id, session.user.id);

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(notification);
}
