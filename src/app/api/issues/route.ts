import { NextRequest, NextResponse } from "next/server";
import {
  createIssueSchema,
  listIssuesQuerySchema,
} from "../../../server/issueSchemas";
import {
  createIssue,
  listIssues,
  UnknownAssigneeError,
  UnknownCycleError,
  UnknownLabelError,
} from "../../../server/issues";
import {
  actorFromSession,
  getWorkspaceSession,
  organizationRequiredResponse,
  unauthorizedResponse,
} from "../../../server/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  const validation = listIssuesQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        fields: validation.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await listIssues(session.workspace.id, validation.data),
    );
  } catch (error) {
    console.error("Failed to load issues", error);
    return NextResponse.json(
      { error: "Issues could not be loaded" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getWorkspaceSession(request);
  if (!session) return unauthorizedResponse();
  if (!session.workspace) return organizationRequiredResponse();

  try {
    const validation = createIssueSchema.safeParse(await request.json());

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await createIssue(validation.data, actorFromSession(session)),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body must be valid JSON" },
        { status: 400 },
      );
    }

    if (
      error instanceof UnknownLabelError ||
      error instanceof UnknownCycleError ||
      error instanceof UnknownAssigneeError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to create issue", error);
    return NextResponse.json(
      { error: "Issue could not be created" },
      { status: 500 },
    );
  }
}
