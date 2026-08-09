import { NextRequest, NextResponse } from "next/server";
import { createCommentSchema } from "../../../../../server/issueSchemas";
import { addComment } from "../../../../../server/issues";
import {
  actorFromSession,
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
  viewerForbiddenResponse,
} from "../../../../../server/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();
  if (session.workspace.role === "viewer") return viewerForbiddenResponse();

  try {
    const validation = createCommentSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const issue = await addComment(
      id,
      validation.data.body,
      actorFromSession(session),
    );

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    console.error("Failed to add comment", error);
    return NextResponse.json(
      { error: "Comment could not be added" },
      { status: 500 },
    );
  }
}
