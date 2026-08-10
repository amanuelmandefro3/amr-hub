import { NextResponse } from "next/server";
import { markAllNotificationsRead } from "../../../../server/notifications";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../../server/session";

export async function POST(request: Request) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  await markAllNotificationsRead(session.user.id);

  return NextResponse.json({ ok: true });
}
