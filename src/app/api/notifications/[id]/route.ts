import { NextRequest, NextResponse } from "next/server";
import { markNotificationRead } from "../../../../server/notifications";
import { requireWorkspaceSession } from "../../../../server/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const result = await requireWorkspaceSession(request);
  if ("response" in result) return result.response;
  const { session } = result;

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
