import { NextRequest, NextResponse } from "next/server";
import { createInvitationSchema } from "../../../server/invitationSchemas";
import {
  createMemberInvitation,
  InvitationError,
  listWorkspaceAccess,
} from "../../../server/invitations";
import {
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

function forbiddenResponse() {
  return NextResponse.json(
    { error: "Owner access required" },
    { status: 403 },
  );
}

export async function GET(request: NextRequest) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();
  if (session.workspace.role !== "owner") return forbiddenResponse();

  try {
    return NextResponse.json(await listWorkspaceAccess(session.workspace.id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to load workspace access", error);
    return NextResponse.json(
      { error: "Workspace access could not be loaded" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();
  if (session.workspace.role !== "owner") return forbiddenResponse();

  try {
    const validation = createInvitationSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Enter a valid email address",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await createMemberInvitation(
      validation.data.email,
      session.user.id,
      request.nextUrl.origin,
      session.workspace.id,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof InvitationError) {
      const messages = {
        ALREADY_INVITED: "A pending invitation already exists for this email",
        EMAIL_IN_USE: "This email already belongs to a workspace member",
        INVITATION_INVALID: "This invitation is no longer available",
      };
      return NextResponse.json(
        { error: messages[error.code] },
        { status: 409 },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    console.error("Failed to create invitation", error);
    return NextResponse.json(
      { error: "Invitation could not be created" },
      { status: 500 },
    );
  }
}
